/** The interface of the runner client. `createRunnerClient` in index.ts implements it over HTTP. */
import type { Job, JobRequest, RunnerHealth } from "@compass/schema";

export interface RunnerClient {
  /** The service's base URL. */
  readonly url: string;
  health(): Promise<RunnerHealth>;
  /** Queues a job. Rejects with RunnerRequestError on 400 or 429. */
  submit(request: JobRequest): Promise<Job>;
  /** Reads a job, holding up to `waitMs` for a terminal state. Resolves to undefined when the service does not know the job. */
  get(id: string, options?: { waitMs?: number; signal?: AbortSignal }): Promise<Job | undefined>;
  /** Cancels a job. Resolves to undefined when the service does not know the job. */
  cancel(id: string): Promise<Job | undefined>;
  /** Reads the job with repeated long waits until it is terminal. Rejects with RunnerRequestError (code "wait-timeout") after `timeoutMs`. */
  waitFor(id: string, options?: { timeoutMs?: number; signal?: AbortSignal }): Promise<Job>;
}

export type RunnerClientOptions = {
  /** Defaults to the COMPASS_RUNNER_URL environment variable, then DEFAULT_RUNNER_URL. */
  url?: string;
  /** For tests. */
  fetch?: typeof fetch;
};

/** The service could not be reached. */
export class RunnerUnavailableError extends Error {
  constructor(
    public readonly url: string,
    options?: ErrorOptions,
  ) {
    super(`The runner service at ${url} could not be reached.`, options);
    this.name = "RunnerUnavailableError";
  }
}

/** The service answered with an error. */
export class RunnerRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RunnerRequestError";
  }
}
