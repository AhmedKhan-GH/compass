/**
 * The in-memory job queue: first in, first out, a fixed number of workers, a bound on queued jobs and a retention
 * period for finished jobs. The executor is injected, so the queue runs without Docker in the unit tests.
 */
import { randomUUID } from "node:crypto";
import { JobResult, isTerminal, type Job, type JobError, type JobRequest, type JobState } from "@compass/schema";
import { JobFailure } from "./failure.ts";

/**
 * Runs one job. Rejects with JobFailure when the run cannot produce a result, and should stop soon after `signal`
 * aborts.
 */
export type Executor = (request: JobRequest, context: { jobId: string; signal: AbortSignal }) => Promise<JobResult>;

export type QueueOptions = {
  executor: Executor;
  /** Jobs running at once. */
  concurrency?: number;
  /** Jobs waiting at once; a submission beyond it is refused. */
  capacity?: number;
  /** How long a finished job stays readable. */
  retentionMs?: number;
  /** For tests. */
  now?: () => number;
  createId?: () => string;
};

export const DEFAULT_CONCURRENCY = 2;
export const DEFAULT_CAPACITY = 32;
export const DEFAULT_RETENTION_MS = 10 * 60 * 1000;

export class QueueFullError extends Error {
  constructor(capacity: number) {
    super(`The queue holds its limit of ${capacity} waiting jobs. Try again shortly.`);
    this.name = "QueueFullError";
  }
}

export class QueueClosedError extends Error {
  constructor() {
    super("The runner service is shutting down.");
    this.name = "QueueClosedError";
  }
}

type Entry = {
  id: string;
  request: JobRequest;
  state: JobState;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  result?: JobResult;
  error?: JobError;
  controller?: AbortController;
  waiters: Set<() => void>;
};

export type QueueCounts = { queued: number; running: number; concurrency: number; capacity: number };

export class JobQueue {
  readonly concurrency: number;
  readonly capacity: number;
  readonly retentionMs: number;
  private readonly executor: Executor;
  private readonly now: () => number;
  private readonly createId: () => string;
  private readonly jobs = new Map<string, Entry>();
  private readonly pending: Entry[] = [];
  /** Executor runs in progress, including runs of jobs already marked cancelled. */
  private readonly active = new Set<Promise<void>>();
  private closed = false;

  constructor(options: QueueOptions) {
    this.executor = options.executor;
    this.concurrency = positiveInteger(options.concurrency ?? DEFAULT_CONCURRENCY, "concurrency");
    this.capacity = positiveInteger(options.capacity ?? DEFAULT_CAPACITY, "capacity");
    this.retentionMs = Math.max(0, options.retentionMs ?? DEFAULT_RETENTION_MS);
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
  }

  /** Queues a job. Throws QueueFullError or QueueClosedError. */
  submit(request: JobRequest): Job {
    if (this.closed) throw new QueueClosedError();
    this.prune();
    if (this.pending.length >= this.capacity) throw new QueueFullError(this.capacity);
    const entry: Entry = {
      id: this.createId(),
      request,
      state: "queued",
      createdAt: this.now(),
      waiters: new Set(),
    };
    this.jobs.set(entry.id, entry);
    this.pending.push(entry);
    this.dispatch();
    return this.snapshot(entry);
  }

  /** The job, or undefined when it is unknown or has expired. */
  get(id: string): Job | undefined {
    this.prune();
    const entry = this.jobs.get(id);
    return entry && this.snapshot(entry);
  }

  /** Resolves when the job is terminal or `waitMs` has passed, with the job as it then is. */
  async wait(id: string, waitMs: number, signal?: AbortSignal): Promise<Job | undefined> {
    this.prune();
    const entry = this.jobs.get(id);
    if (!entry || isTerminal(entry.state) || waitMs <= 0 || signal?.aborted) return entry && this.snapshot(entry);
    await new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        entry.waiters.delete(done);
        signal?.removeEventListener("abort", done);
        resolve();
      };
      const timer = setTimeout(done, waitMs);
      entry.waiters.add(done);
      signal?.addEventListener("abort", done, { once: true });
    });
    return this.get(id);
  }

  /** Cancels a queued or running job; a finished job is returned unchanged. Undefined when the job is unknown. */
  cancel(id: string): Job | undefined {
    this.prune();
    const entry = this.jobs.get(id);
    if (!entry) return undefined;
    if (entry.state === "queued") {
      this.pending.splice(this.pending.indexOf(entry), 1);
      this.finish(entry, "cancelled");
    } else if (entry.state === "running") {
      this.finish(entry, "cancelled");
      // The executor removes the container; its worker slot frees when it settles.
      entry.controller?.abort();
    }
    return this.snapshot(entry);
  }

  counts(): QueueCounts {
    this.prune();
    let running = 0;
    for (const entry of this.jobs.values()) if (entry.state === "running") running++;
    return { queued: this.pending.length, running, concurrency: this.concurrency, capacity: this.capacity };
  }

  /** Stops accepting jobs, cancels every queued and running job, and waits for the running executors to settle. */
  async close(): Promise<void> {
    this.closed = true;
    for (const entry of [...this.pending]) this.cancel(entry.id);
    for (const entry of this.jobs.values()) if (entry.state === "running") this.cancel(entry.id);
    await Promise.allSettled([...this.active]);
  }

  private dispatch(): void {
    while (!this.closed && this.active.size < this.concurrency && this.pending.length) {
      const entry = this.pending.shift();
      if (entry) this.start(entry);
    }
  }

  private start(entry: Entry): void {
    const controller = new AbortController();
    entry.state = "running";
    entry.startedAt = this.now();
    entry.controller = controller;
    const run = this.execute(entry, controller.signal).finally(() => {
      this.active.delete(run);
      entry.controller = undefined;
      this.dispatch();
    });
    this.active.add(run);
  }

  private async execute(entry: Entry, signal: AbortSignal): Promise<void> {
    let outcome: { result: JobResult } | { error: JobError };
    try {
      const result = JobResult.safeParse(await this.executor(entry.request, { jobId: entry.id, signal }));
      outcome = result.success
        ? { result: result.data }
        : { error: { kind: "invalid-result", message: "The runner produced a result of the wrong shape." } };
    } catch (error) {
      outcome = {
        error:
          error instanceof JobFailure
            ? error.toJobError()
            : { kind: "execution", message: "The run failed unexpectedly." },
      };
    }
    // A cancelled job keeps its state whatever the executor reports.
    if (entry.state !== "running") return;
    if ("result" in outcome) this.finish(entry, "succeeded", { result: outcome.result });
    else this.finish(entry, "failed", { error: outcome.error });
  }

  private finish(
    entry: Entry,
    state: "succeeded" | "failed" | "cancelled",
    outcome: { result?: JobResult; error?: JobError } = {},
  ): void {
    entry.state = state;
    entry.finishedAt = this.now();
    entry.result = outcome.result;
    entry.error = outcome.error;
    for (const wake of [...entry.waiters]) wake();
  }

  /** Forgets finished jobs older than the retention period. */
  private prune(): void {
    const cutoff = this.now() - this.retentionMs;
    for (const [id, entry] of this.jobs)
      if (entry.finishedAt !== undefined && entry.finishedAt <= cutoff && isTerminal(entry.state)) this.jobs.delete(id);
  }

  private snapshot(entry: Entry): Job {
    const iso = (time: number | undefined) => (time === undefined ? undefined : new Date(time).toISOString());
    const startedAt = iso(entry.startedAt);
    const finishedAt = iso(entry.finishedAt);
    return {
      id: entry.id,
      runner: entry.request.runner,
      state: entry.state,
      createdAt: new Date(entry.createdAt).toISOString(),
      ...(startedAt ? { startedAt } : {}),
      ...(finishedAt ? { finishedAt } : {}),
      ...(entry.state === "queued" ? { position: this.pending.indexOf(entry) } : {}),
      ...(entry.state === "succeeded" && entry.result ? { result: entry.result } : {}),
      ...(entry.state === "failed" && entry.error ? { error: entry.error } : {}),
    };
  }
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`The queue ${name} must be a positive integer.`);
  return value;
}
