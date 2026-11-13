/**
 * The browser's client for the web app's API (docs/ARCHITECTURE.md, "The web app"). Every response is validated
 * with the schemas in packages/schema; a failed request throws a RequestError with the server's message.
 */
import {
  ApiError,
  CircuitRecord,
  CourseProgress,
  ItemProgress,
  RunHistoryPage,
  RunRecord,
  RunnerHealth,
  type StartCircuitRequest,
  type StartRunRequest,
} from "@compass/schema";
import { RequestError } from "./job-poll.ts";

/** What this client needs of a schema: zod's safeParse. */
type Schema<T> = { safeParse(value: unknown): { success: true; data: T } | { success: false } };

/** The schema of `{ [name]: T }`, read as the T. */
function field<T>(name: string, schema: Schema<T>): Schema<T> {
  return {
    safeParse(value) {
      if (!value || typeof value !== "object" || !(name in value)) return { success: false };
      return schema.safeParse((value as Record<string, unknown>)[name]);
    },
  };
}

export function courseApi(courseId: string): string {
  const [namespace, name] = courseId.split("/");
  return `/api/courses/${encodeURIComponent(namespace ?? "")}/${encodeURIComponent(name ?? "")}`;
}

export function itemApi(courseId: string, itemSlug: string): string {
  return `${courseApi(courseId)}/items/${encodeURIComponent(itemSlug)}`;
}

async function request<T>(url: string, schema: Schema<T>, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new RequestError("The server could not be reached.");
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const parsed = ApiError.safeParse(body);
    throw new RequestError(
      parsed.success ? parsed.data.error.message : `${response.status} ${response.statusText}`.trim(),
      response.status,
      parsed.success ? parsed.data.error.code : undefined,
    );
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    throw new RequestError("The server sent a response this page does not understand.", response.status);
  return parsed.data;
}

function post(body: unknown, signal?: AbortSignal): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  };
}

const RunResponse = field("run", RunRecord);
const CircuitResponse = field("circuit", CircuitRecord);
const ProgressResponse = field("progress", ItemProgress);

export function startRun(courseId: string, itemSlug: string, body: StartRunRequest, signal?: AbortSignal) {
  return request(`${itemApi(courseId, itemSlug)}/runs`, RunResponse, post(body, signal));
}

export function getRun(id: string, waitMs?: number, signal?: AbortSignal) {
  const query = waitMs ? `?wait=${waitMs}` : "";
  return request(`/api/runs/${encodeURIComponent(id)}${query}`, RunResponse, signal ? { signal } : {});
}

export function listRuns(courseId: string, itemSlug: string, cursor?: string, signal?: AbortSignal) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return request(`${itemApi(courseId, itemSlug)}/runs${query}`, RunHistoryPage, signal ? { signal } : {});
}

export function startCircuit(courseId: string, itemSlug: string, body: StartCircuitRequest, signal?: AbortSignal) {
  return request(`${itemApi(courseId, itemSlug)}/circuit`, CircuitResponse, post(body, signal));
}

export function getCircuit(id: string, waitMs?: number, signal?: AbortSignal) {
  const query = waitMs ? `?wait=${waitMs}` : "";
  return request(`/api/circuits/${encodeURIComponent(id)}${query}`, CircuitResponse, signal ? { signal } : {});
}

export function getProgress(courseId: string, signal?: AbortSignal) {
  return request(`${courseApi(courseId)}/progress`, CourseProgress, signal ? { signal } : {});
}

export function resetProgress(courseId: string, itemSlug: string) {
  return request(`${itemApi(courseId, itemSlug)}/reset`, ProgressResponse, post({}));
}

export function getRunnerHealth(signal?: AbortSignal) {
  return request("/api/runner", RunnerHealth, signal ? { signal } : {});
}
