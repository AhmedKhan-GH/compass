/**
 * The life of a run or a circuit job as the browser sees it. `POST` returns a record in state `queued`; the browser
 * then asks for it with `?wait=` until its state is terminal, showing `queued` (with its position) and `running` on
 * the way. Pure apart from the injected requests, so the state machine can be tested without a server.
 */
import type { JobState } from "@compass/schema";

export type JobLike = { id: string; state: JobState; position?: number };

export type JobPhase<T extends JobLike> =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "queued"; record: T; position?: number }
  | { phase: "running"; record: T }
  /** The job reached a terminal state: succeeded, failed or cancelled. */
  | { phase: "finished"; record: T }
  /** A request failed: the server answered with an error, or could not be reached. */
  | { phase: "error"; message: string; status?: number; record?: T };

const TERMINAL: readonly JobState[] = ["succeeded", "failed", "cancelled"];

export function phaseOf<T extends JobLike>(record: T): JobPhase<T> {
  if (TERMINAL.includes(record.state)) return { phase: "finished", record };
  if (record.state === "running") return { phase: "running", record };
  return record.position === undefined
    ? { phase: "queued", record }
    : { phase: "queued", record, position: record.position };
}

export function isBusy(phase: JobPhase<JobLike>): boolean {
  return phase.phase === "starting" || phase.phase === "queued" || phase.phase === "running";
}

export class RequestError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.code = code;
  }
}

export type PollOptions<T extends JobLike> = {
  start: () => Promise<T>;
  get: (id: string, waitMs: number) => Promise<T>;
  onPhase: (phase: JobPhase<T>) => void;
  signal?: AbortSignal;
  /** How long the server may hold each request. */
  waitMs?: number;
  /** Failed reads in a row that are retried before giving up. */
  retries?: number;
  /** The pause before retry `attempt` (1-based). */
  retryDelayMs?: (attempt: number) => number;
  /** The shortest time between two reads, in case the server answers at once. */
  minIntervalMs?: number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  now?: () => number;
};

export const DEFAULT_WAIT_MS = 5000;

/**
 * Starts a job and follows it to a terminal state. Reports every phase through `onPhase` and resolves with the last
 * one, `finished` or `error`. Rejects with the abort reason when `signal` aborts.
 */
export async function followJob<T extends JobLike>(options: PollOptions<T>): Promise<JobPhase<T>> {
  const {
    start,
    get,
    onPhase,
    signal,
    waitMs = DEFAULT_WAIT_MS,
    retries = 3,
    retryDelayMs = (attempt) => 500 * 2 ** (attempt - 1),
    minIntervalMs = 400,
    sleep = defaultSleep,
    now = Date.now,
  } = options;
  const report = (phase: JobPhase<T>) => {
    signal?.throwIfAborted();
    onPhase(phase);
    return phase;
  };

  report({ phase: "starting" });
  let record: T;
  try {
    record = await start();
  } catch (error) {
    signal?.throwIfAborted();
    return report(errorPhase(error));
  }
  let phase = report(phaseOf(record));
  let failures = 0;
  while (phase.phase === "queued" || phase.phase === "running") {
    const began = now();
    try {
      record = await get(record.id, waitMs);
      failures = 0;
    } catch (error) {
      signal?.throwIfAborted();
      failures += 1;
      if (failures > retries || !retryable(error)) return report({ ...errorPhase(error), record });
      await sleep(retryDelayMs(failures), signal);
      continue;
    }
    const next = phaseOf(record);
    if (!samePhase(phase, next)) phase = report(next);
    else phase = next;
    const elapsed = now() - began;
    if ((phase.phase === "queued" || phase.phase === "running") && elapsed < minIntervalMs)
      await sleep(minIntervalMs - elapsed, signal);
  }
  return phase;
}

function samePhase<T extends JobLike>(a: JobPhase<T>, b: JobPhase<T>): boolean {
  if (a.phase !== b.phase) return false;
  if (a.phase === "queued" && b.phase === "queued") return a.position === b.position;
  return true;
}

/** Network failures and server errors are retried; a request the server rejected is not. */
export function retryable(error: unknown): boolean {
  if (!(error instanceof RequestError)) return true;
  return error.status === undefined || error.status >= 500 || error.status === 429;
}

export function errorPhase(error: unknown): { phase: "error"; message: string; status?: number } {
  if (error instanceof RequestError)
    return error.status === undefined
      ? { phase: "error", message: error.message }
      : { phase: "error", message: error.message, status: error.status };
  return { phase: "error", message: error instanceof Error ? error.message : String(error) };
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
