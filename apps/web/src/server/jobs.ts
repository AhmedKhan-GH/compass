/** What runs and circuits share: reading a runner job, in-flight submissions, and the bounds on stored text. */
import { isTerminal, type Job, type JobError } from "@compass/schema";
import { isRunnerUnavailable, runnerClient } from "./runner.ts";

/** Bytes of the simulation log kept: its tail. The old store kept 32 KiB. */
export const LOG_BYTES = 32 * 1024;
/** Bytes of a VCD waveform kept, cut at a line boundary. The old store kept 512 KiB. */
export const WAVEFORM_BYTES = 512 * 1024;
/** Bytes of diagnostics or circuit warnings kept: their head. */
export const DIAGNOSTICS_BYTES = 32 * 1024;
/** Bytes of a DigitalJS circuit accepted. The old store accepted 3 MiB. */
export const CIRCUIT_BYTES = 3 * 1024 * 1024;

/** The last `max` bytes of `text`, starting at a line boundary when one is near. */
export function tailBytes(text: string, max: number): string {
  const bytes = Buffer.from(text, "utf8");
  if (bytes.byteLength <= max) return text;
  const tail = bytes.subarray(bytes.byteLength - max);
  const newline = tail.indexOf(0x0a);
  return tail.subarray(newline >= 0 && newline < 4096 ? newline + 1 : 0).toString("utf8").replace(/^�+/, "");
}

/** The first `max` bytes of `text`, ending at a line boundary when one exists. */
export function headBytes(text: string, max: number): string {
  const bytes = Buffer.from(text, "utf8");
  if (bytes.byteLength <= max) return text;
  const head = bytes.subarray(0, max);
  const newline = head.lastIndexOf(0x0a);
  return head.subarray(0, newline >= 0 ? newline + 1 : max).toString("utf8").replace(/�+$/, "");
}

export function boundError(error: JobError): JobError {
  return {
    kind: error.kind,
    message: headBytes(error.message, DIAGNOSTICS_BYTES),
    ...(error.diagnostics !== undefined ? { diagnostics: headBytes(error.diagnostics, DIAGNOSTICS_BYTES) } : {}),
  };
}

export function unavailable(message: string): JobError {
  return { kind: "unavailable", message };
}

/** What the runner says about a job. */
export type Observation =
  | { kind: "open"; state: "queued" | "running"; position: number | undefined }
  | { kind: "done"; job: Job }
  /** The runner does not know the job or cannot be reached; jobs do not survive a runner restart. */
  | { kind: "lost"; error: JobError };

/** Reads a job from the runner, holding up to `waitMs` for a terminal state. */
export async function observeJob(jobId: string, options: { waitMs: number; signal?: AbortSignal }): Promise<Observation> {
  const client = await runnerClient();
  let job: Job | undefined;
  try {
    job = await client.get(jobId, {
      ...(options.waitMs > 0 ? { waitMs: options.waitMs } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (isRunnerUnavailable(error))
      return { kind: "lost", error: unavailable("The runner service could not be reached, so this job was lost.") };
    throw error;
  }
  if (!job) return { kind: "lost", error: unavailable("The runner no longer has this job. It may have restarted.") };
  if (isTerminal(job.state)) return { kind: "done", job };
  return {
    kind: "open",
    state: job.state === "running" ? "running" : "queued",
    position: job.state === "queued" ? job.position : undefined,
  };
}

const held = globalThis as typeof globalThis & { compassPendingSubmissions?: Map<string, Promise<unknown>> };
function pending(): Map<string, Promise<unknown>> {
  return (held.compassPendingSubmissions ??= new Map());
}

/** Runs `submit` while recording it under `key`, so a reader of the record can wait for it to finish. */
export async function trackSubmission<T>(key: string, submit: () => Promise<T>): Promise<T> {
  const promise = submit();
  pending().set(key, promise);
  try {
    return await promise;
  } finally {
    pending().delete(key);
  }
}

/** Waits for the submission recorded under `key`, if this process is making one. False when there is none. */
export async function awaitSubmission(key: string): Promise<boolean> {
  const promise = pending().get(key);
  if (!promise) return false;
  await promise.catch(() => undefined);
  return true;
}

/** True when the error is the abort of the request's own signal. */
export function isAbort(error: unknown, signal: AbortSignal | undefined): boolean {
  if (!signal?.aborted) return false;
  return error === signal.reason || (error instanceof Error && error.name === "AbortError");
}
