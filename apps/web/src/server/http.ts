/** What the API routes share: the error shape, JSON responses, bounded body reading and the loopback check. */
import { MAX_WAIT_MS, type ApiError } from "@compass/schema";
import { isRunnerRequestError, isRunnerUnavailable } from "./runner.ts";

/** The largest request body the API reads. A run carries at most 16 files of 64 KiB. */
export const BODY_LIMIT_BYTES = 1024 * 1024;

/** An error the API reports to the browser as `{ error: { code, message } }`. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function errorBody(code: string, message: string): ApiError {
  return { error: { code, message } };
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) return json(errorBody(error.code, error.message), error.status);
  if (isRunnerUnavailable(error))
    return json(errorBody("runner-unavailable", "The runner service could not be reached."), 503);
  if (isRunnerRequestError(error)) {
    if (error.status === 429)
      return json(errorBody("runner-busy", "The runner queue is full. Try again in a moment."), 429);
    console.error("The runner service rejected a request", error);
    return json(errorBody("runner-error", "The runner service rejected the request."), 502);
  }
  console.error("API request failed", error);
  return json(errorBody("internal", "The request failed. Check the server log."), 500);
}

/**
 * The site has no accounts and serves only the loopback interface. Refuse requests addressed to another host
 * (DNS rebinding) and requests a browser marks as coming from another site.
 */
export function assertLocalRequest(request: Request): void {
  const url = new URL(request.url);
  // Next may normalise request.url; the Host header names the address the browser opened.
  const host = request.headers.get("host");
  if (host) url.host = host;
  const origin = request.headers.get("origin");
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    (origin !== null && origin !== url.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new HttpError(403, "forbidden", "Open Compass on this computer's loopback address.");
}

/** Reads a JSON body of at most `limit` bytes. */
export async function readJson(request: Request, limit = BODY_LIMIT_BYTES): Promise<unknown> {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") throw new HttpError(415, "unsupported-media-type", "Send application/json.");
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw new HttpError(413, "payload-too-large", "The request body is too large.");
  if (!request.body) throw new HttpError(400, "invalid-json", "The request body is empty.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new HttpError(413, "payload-too-large", "The request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "invalid-json", "The request body is not valid JSON.");
  }
}

/** `?wait=<ms>`, capped at the runner's limit. */
export function waitParameter(request: Request): number {
  const value = new URL(request.url).searchParams.get("wait");
  if (value === null || value === "") return 0;
  if (!/^\d{1,9}$/.test(value))
    throw new HttpError(400, "invalid-wait", "wait must be a whole number of milliseconds.");
  return Math.min(Number(value), MAX_WAIT_MS);
}

/** The first message of a failed schema parse, for a 400 response. */
export function issueMessage(issues: readonly { path: readonly PropertyKey[]; message: string }[]): string {
  const issue = issues[0];
  if (!issue) return "The request is not valid.";
  const where = issue.path.map(String).join(".");
  return where ? `${where}: ${issue.message}` : issue.message;
}
