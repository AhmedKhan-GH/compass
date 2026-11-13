/** The runner service's HTTP API on node:http. See "The runner service" in docs/ARCHITECTURE.md. */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import {
  JobRequest,
  JobState,
  MAX_WAIT_MS,
  RUNNER_KINDS,
  type ApiError,
  type JobResponse,
  type RunnerHealth,
} from "@compass/schema";
import { QueueClosedError, QueueFullError, type JobQueue, type SeenJob } from "./queue.ts";
import { checkJobRequest } from "./requests.ts";
import { inspectImage as dockerInspectImage } from "./sandbox.ts";

/** The service has no authentication, so it never listens on another interface. */
export const HOST = "127.0.0.1";

/** Larger than any request within SOURCE_LIMITS, with room for JSON escaping. */
export const MAX_BODY_BYTES = 8 * 1024 * 1024;

export type ServerOptions = {
  queue: JobQueue;
  /** The image id of a tag, or undefined when it is not available. For tests. */
  inspectImage?: (image: string) => Promise<string | undefined>;
  maxBodyBytes?: number;
};

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  if (res.headersSent || res.destroyed) return;
  const text = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(text),
    "cache-control": "no-store",
    ...headers,
  });
  res.end(text);
}

function sendError(res: ServerResponse, error: HttpError): void {
  const body: ApiError = { error: { code: error.code, message: error.message } };
  send(res, error.status, body, error.headers);
}

function methodNotAllowed(allowed: string[]): HttpError {
  return new HttpError(405, "method-not-allowed", `Use ${allowed.join(" or ")}.`, { allow: allowed.join(", ") });
}

async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  const tooLarge = () =>
    new HttpError(413, "body-too-large", `The request body exceeds ${limit} bytes.`, { connection: "close" });
  const declared = Number(req.headers["content-length"]);
  if (Number.isFinite(declared) && declared > limit) throw tooLarge();
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    length += chunk.length;
    if (length > limit) throw tooLarge();
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

function parseWait(value: string | null): number {
  if (value === null) return 0;
  if (!/^\d{1,9}$/.test(value))
    throw new HttpError(400, "invalid-wait", "wait must be a whole number of milliseconds.");
  return Math.min(Number(value), MAX_WAIT_MS);
}

/** `&state=` and `&position=`: what the caller last saw of the job. Undefined without `state`. */
function parseSeen(params: URLSearchParams): SeenJob | undefined {
  const state = params.get("state");
  const position = params.get("position");
  if (state === null) {
    if (position !== null) throw new HttpError(400, "invalid-wait", "position needs a state.");
    return undefined;
  }
  const parsed = JobState.safeParse(state);
  if (!parsed.success)
    throw new HttpError(400, "invalid-wait", `state must be one of ${JobState.options.join(", ")}.`);
  if (position === null) return { state: parsed.data };
  if (!/^\d{1,9}$/.test(position))
    throw new HttpError(400, "invalid-wait", "position must be a whole number of jobs.");
  return { state: parsed.data, position: Number(position) };
}

export function createRunnerServer(options: ServerOptions): Server {
  const { queue } = options;
  const inspect = options.inspectImage ?? ((image: string) => dockerInspectImage(image));
  const maxBodyBytes = options.maxBodyBytes ?? MAX_BODY_BYTES;

  async function health(): Promise<RunnerHealth> {
    const runners = await Promise.all(
      Object.entries(RUNNER_KINDS).map(async ([kind, info]) => {
        const imageId = await inspect(info.image);
        return {
          kind,
          purpose: info.purpose,
          image: info.image,
          available: imageId !== undefined,
          ...(imageId ? { imageId } : {}),
        };
      }),
    );
    return { status: "ok", runners, queue: queue.counts() };
  }

  async function submit(req: IncomingMessage): Promise<JobResponse> {
    const type = req.headers["content-type"] ?? "";
    if (!/^application\/json\s*(;|$)/i.test(type))
      throw new HttpError(415, "unsupported-media-type", "Send the job as application/json.");
    const body = await readBody(req, maxBodyBytes);
    let value: unknown;
    try {
      value = JSON.parse(body.toString("utf8"));
    } catch {
      throw new HttpError(400, "invalid-json", "The request body is not valid JSON.");
    }
    const parsed = JobRequest.safeParse(value);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.map(String).join(".") || "request"}: ${issue.message}`)
        .join("; ");
      throw new HttpError(400, "invalid-request", `The job request is invalid. ${detail}`);
    }
    const problem = checkJobRequest(parsed.data);
    if (problem) throw new HttpError(400, "invalid-request", problem);
    try {
      return { job: queue.submit(parsed.data) };
    } catch (error) {
      if (error instanceof QueueFullError)
        throw new HttpError(429, "queue-full", error.message, { "retry-after": "1" });
      if (error instanceof QueueClosedError) throw new HttpError(503, "shutting-down", error.message);
      throw error;
    }
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", `http://${HOST}`);
    const method = req.method ?? "GET";
    if (url.pathname === "/v1/health") {
      if (method !== "GET") throw methodNotAllowed(["GET"]);
      return send(res, 200, await health());
    }
    if (url.pathname === "/v1/jobs") {
      if (method !== "POST") throw methodNotAllowed(["POST"]);
      return send(res, 202, await submit(req));
    }
    const match = /^\/v1\/jobs\/([^/]+)$/.exec(url.pathname);
    if (!match?.[1]) throw new HttpError(404, "not-found", "No such resource.");
    let id: string;
    try {
      id = decodeURIComponent(match[1]);
    } catch {
      throw new HttpError(404, "not-found", "No such job.");
    }
    const unknown = () => new HttpError(404, "not-found", "The job is unknown or has expired.");
    if (method === "GET") {
      const waitMs = parseWait(url.searchParams.get("wait"));
      const seen = parseSeen(url.searchParams);
      const disconnected = new AbortController();
      res.once("close", () => disconnected.abort());
      const job = await queue.wait(id, waitMs, { seen, signal: disconnected.signal });
      if (!job) throw unknown();
      return send(res, 200, { job } satisfies JobResponse);
    }
    if (method === "DELETE") {
      const job = queue.cancel(id);
      if (!job) throw unknown();
      return send(res, 200, { job } satisfies JobResponse);
    }
    throw methodNotAllowed(["GET", "DELETE"]);
  }

  return createServer((req, res) => {
    handle(req, res).catch((error: unknown) => {
      if (error instanceof HttpError) sendError(res, error);
      else {
        console.error(error);
        sendError(res, new HttpError(500, "internal", "The runner service failed to handle the request."));
      }
    });
  });
}

/** Listens on 127.0.0.1 only. Port 0 picks a free port. */
export function listen(server: Server, port: number): Promise<AddressInfo> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, HOST, () => {
      server.off("error", reject);
      resolve(server.address() as AddressInfo);
    });
  });
}
