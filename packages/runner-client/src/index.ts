/** A typed HTTP client for the runner service. */
import {
  ApiError,
  DEFAULT_RUNNER_URL,
  JobResponse,
  MAX_WAIT_MS,
  RunnerHealth,
  isTerminal,
  type Job,
  type JobRequest,
} from "@compass/schema";
import { RunnerRequestError, RunnerUnavailableError, type RunnerClient, type RunnerClientOptions } from "./types.ts";

export * from "./types.ts";

/** How long a call other than a long wait may take before the service counts as unreachable. */
const REQUEST_TIMEOUT_MS = 10_000;
/** The default overall limit of waitFor. */
const DEFAULT_WAIT_FOR_MS = 120_000;

type Schema<T> = { safeParse(value: unknown): { success: true; data: T } | { success: false } };

function defaultUrl(): string {
  const fromEnvironment = typeof process === "undefined" ? undefined : process.env.COMPASS_RUNNER_URL;
  return fromEnvironment || DEFAULT_RUNNER_URL;
}

export function createRunnerClient(options: RunnerClientOptions = {}): RunnerClient {
  const url = (options.url ?? defaultUrl()).replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? globalThis.fetch;

  async function request<T>(
    path: string,
    schema: Schema<T>,
    init: { method?: string; body?: unknown; timeoutMs?: number; signal?: AbortSignal } = {},
  ): Promise<T> {
    const timeout = AbortSignal.timeout(init.timeoutMs ?? REQUEST_TIMEOUT_MS);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    let response: Response;
    let text: string;
    try {
      response = await fetchImpl(url + path, {
        method: init.method ?? "GET",
        headers:
          init.body === undefined
            ? { accept: "application/json" }
            : { accept: "application/json", "content-type": "application/json" },
        ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
        signal,
      });
      text = await response.text();
    } catch (error) {
      // The caller's own abort is not an outage.
      if (init.signal?.aborted) throw init.signal.reason ?? error;
      throw new RunnerUnavailableError(url, { cause: error });
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
    if (!response.ok) {
      const parsed = ApiError.safeParse(body);
      if (parsed.success)
        throw new RunnerRequestError(response.status, parsed.data.error.code, parsed.data.error.message);
      throw new RunnerRequestError(
        response.status,
        `http-${response.status}`,
        `The runner service answered ${response.status} ${response.statusText}.`,
      );
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      throw new RunnerRequestError(
        response.status,
        "invalid-response",
        "The runner service sent a response of the wrong shape.",
      );
    return parsed.data;
  }

  /** Like request, but resolves to undefined when the service does not know the job. */
  async function requestJob(path: string, init: Parameters<typeof request>[2]): Promise<Job | undefined> {
    try {
      return (await request(path, JobResponse, init)).job;
    } catch (error) {
      if (error instanceof RunnerRequestError && error.status === 404) return undefined;
      throw error;
    }
  }

  const jobPath = (id: string) => `/v1/jobs/${encodeURIComponent(id)}`;

  const client: RunnerClient = {
    url,

    async health() {
      return request("/v1/health", RunnerHealth);
    },

    async submit(job: JobRequest) {
      return (await request("/v1/jobs", JobResponse, { method: "POST", body: job })).job;
    },

    async get(id, options = {}) {
      const waitMs = Math.max(0, Math.min(MAX_WAIT_MS, Math.floor(options.waitMs ?? 0)));
      const query = waitMs > 0 ? `?wait=${waitMs}` : "";
      return requestJob(jobPath(id) + query, {
        timeoutMs: waitMs + REQUEST_TIMEOUT_MS,
        ...(options.signal ? { signal: options.signal } : {}),
      });
    },

    async cancel(id) {
      return requestJob(jobPath(id), { method: "DELETE" });
    },

    async waitFor(id, options = {}) {
      const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_WAIT_FOR_MS);
      for (;;) {
        const remaining = deadline - Date.now();
        const job: Job | undefined = await client.get(id, {
          waitMs: Math.max(0, Math.min(MAX_WAIT_MS, remaining)),
          ...(options.signal ? { signal: options.signal } : {}),
        });
        if (!job) throw new RunnerRequestError(404, "not-found", "The job is unknown or has expired.");
        if (isTerminal(job.state)) return job;
        if (Date.now() >= deadline)
          throw new RunnerRequestError(408, "wait-timeout", `The job ${id} did not finish in time.`);
      }
    },
  };
  return client;
}
