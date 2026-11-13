/**
 * The web API, one function per route. The route files under src/app/api only delegate here.
 * Responses carry RunRecord, CircuitRecord and progress types only; nothing here returns an indexed item.
 */
import {
  COURSE_ID_PATTERN,
  SLUG_PATTERN,
  StartCircuitRequest,
  StartRunRequest,
  UUID_PATTERN,
  type CourseView,
  type IndexedCourse,
  type IndexedItem,
} from "@compass/schema";
import { startCircuit, readCircuit } from "./circuits.ts";
import { findCourse, findIndexedItem } from "./content.ts";
import {
  HttpError,
  assertLocalRequest,
  errorBody,
  errorResponse,
  issueMessage,
  json,
  readJson,
  seenParameter,
  waitParameter,
} from "./http.ts";
import { courseProgress, resetItem } from "./progress.ts";
import { isRunnerUnavailable, runnerClient } from "./runner.ts";
import { readRun, runHistory, startRun } from "./runs.ts";

export type CourseParams = { namespace: string; course: string };
export type ItemParams = CourseParams & { item: string };
export type IdParams = { id: string };

async function respond(request: Request, handle: () => Promise<Response>): Promise<Response> {
  try {
    assertLocalRequest(request);
    return await handle();
  } catch (error) {
    return errorResponse(error);
  }
}

function courseId(params: CourseParams): string {
  const id = `${params.namespace}/${params.course}`;
  if (!COURSE_ID_PATTERN.test(id)) throw new HttpError(404, "not-found", "There is no such course.");
  return id;
}

/** Reads the content index, reporting a missing or invalid index as 503. */
function fromIndex<T>(read: () => T): T {
  try {
    return read();
  } catch (error) {
    console.error("The content index could not be read", error);
    throw new HttpError(503, "content-unavailable", "The content index could not be read.");
  }
}

function indexedItem(params: ItemParams): { course: IndexedCourse; item: IndexedItem } {
  const id = courseId(params);
  const found = SLUG_PATTERN.test(params.item) ? fromIndex(() => findIndexedItem(id, params.item)) : undefined;
  if (!found) throw new HttpError(404, "not-found", "There is no such exercise.");
  return found;
}

function course(params: CourseParams): CourseView {
  const id = courseId(params);
  const found = fromIndex(() => findCourse(id));
  if (!found) throw new HttpError(404, "not-found", "There is no such course.");
  return found;
}

function recordId(params: IdParams): string {
  if (!UUID_PATTERN.test(params.id)) throw new HttpError(404, "not-found", "There is no such record.");
  return params.id;
}

/** POST {c}/items/[item]/runs with StartRunRequest: 202 { run }. */
export function startRunRoute(request: Request, params: Promise<ItemParams>): Promise<Response> {
  return respond(request, async () => {
    const found = indexedItem(await params);
    const input = StartRunRequest.safeParse(await readJson(request));
    if (!input.success) throw new HttpError(400, "invalid-request", issueMessage(input.error.issues));
    return json({ run: await startRun(found, input.data) }, 202);
  });
}

/** GET {c}/items/[item]/runs?cursor=: 200 RunHistoryPage. */
export function runHistoryRoute(request: Request, params: Promise<ItemParams>): Promise<Response> {
  return respond(request, async () => {
    const { course, item } = indexedItem(await params);
    const cursor = new URL(request.url).searchParams.get("cursor");
    return json(runHistory(course.id, item.id, cursor));
  });
}

/** GET /api/runs/[id]?wait=&state=&position=: 200 { run }. */
export function readRunRoute(request: Request, params: Promise<IdParams>): Promise<Response> {
  return respond(request, async () => {
    const id = recordId(await params);
    const run = await readRun(id, {
      waitMs: waitParameter(request),
      seen: seenParameter(request),
      signal: request.signal,
    });
    if (!run) throw new HttpError(404, "not-found", "There is no such run.");
    return json({ run });
  });
}

/** POST {c}/items/[item]/circuit with StartCircuitRequest: 202 { circuit }. */
export function startCircuitRoute(request: Request, params: Promise<ItemParams>): Promise<Response> {
  return respond(request, async () => {
    const found = indexedItem(await params);
    const input = StartCircuitRequest.safeParse(await readJson(request));
    if (!input.success) throw new HttpError(400, "invalid-request", issueMessage(input.error.issues));
    return json({ circuit: await startCircuit(found, input.data) }, 202);
  });
}

/** GET /api/circuits/[id]?wait=&state=: 200 { circuit }. A position is accepted and ignored: a circuit has none. */
export function readCircuitRoute(request: Request, params: Promise<IdParams>): Promise<Response> {
  return respond(request, async () => {
    const id = recordId(await params);
    const circuit = await readCircuit(id, {
      waitMs: waitParameter(request),
      seen: seenParameter(request),
      signal: request.signal,
    });
    if (!circuit) throw new HttpError(404, "not-found", "There is no such circuit.");
    return json({ circuit });
  });
}

/** GET {c}/progress: 200 CourseProgress. */
export function courseProgressRoute(request: Request, params: Promise<CourseParams>): Promise<Response> {
  return respond(request, async () => json(courseProgress(course(await params))));
}

/** POST {c}/items/[item]/reset: 200 { progress }. */
export function resetItemRoute(request: Request, params: Promise<ItemParams>): Promise<Response> {
  return respond(request, async () => {
    const { course, item } = indexedItem(await params);
    return json({ progress: resetItem(course.id, item) });
  });
}

/** GET /api/runner: 200 RunnerHealth, or 503 when the service cannot be reached. */
export function runnerHealthRoute(request: Request): Promise<Response> {
  return respond(request, async () => {
    const client = await runnerClient();
    try {
      return json(await client.health());
    } catch (error) {
      if (isRunnerUnavailable(error))
        return json(errorBody("runner-unavailable", `The runner service at ${client.url} could not be reached.`), 503);
      throw error;
    }
  });
}
