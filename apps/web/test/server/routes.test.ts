import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import {
  ApiError,
  CircuitRecord,
  CourseProgress,
  ItemProgress,
  MAX_WAIT_MS,
  RunHistoryPage,
  RunRecord,
  RunnerHealth,
} from "@compass/schema";
import * as circuitRoute from "../../src/app/api/courses/[namespace]/[course]/items/[item]/circuit/route.ts";
import * as resetRoute from "../../src/app/api/courses/[namespace]/[course]/items/[item]/reset/route.ts";
import * as runsRoute from "../../src/app/api/courses/[namespace]/[course]/items/[item]/runs/route.ts";
import * as progressRoute from "../../src/app/api/courses/[namespace]/[course]/progress/route.ts";
import * as circuitByIdRoute from "../../src/app/api/circuits/[id]/route.ts";
import * as runnerRoute from "../../src/app/api/runner/route.ts";
import * as runByIdRoute from "../../src/app/api/runs/[id]/route.ts";
import { CHECKS_MARKER, PLAIN_ITEM, TASKS_ITEM, freshEnvironment, passReport, testResult } from "./fixture.ts";

const origin = "http://127.0.0.1:3100";
const course = "/api/courses/test/verilog";
const solution = "module top_module(output out); assign out = 1'b1; endmodule\n";

function itemContext(item: string = TASKS_ITEM.slug, namespace = "test", name = "verilog") {
  return { params: Promise.resolve({ namespace, course: name, item }) };
}
function courseContext(namespace = "test", name = "verilog") {
  return { params: Promise.resolve({ namespace, course: name }) };
}
function idContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

function post(url: string, body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(origin + url, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
function get(url: string, headers: Record<string, string> = {}): Request {
  return new Request(origin + url, { headers });
}

/** Reads a response, checking that it never carries the checks and is never cached. */
async function read(response: Promise<Response>): Promise<{ status: number; body: unknown }> {
  const result = await response;
  const text = await result.text();
  assert.ok(!text.includes(CHECKS_MARKER), "a response carried the checks");
  assert.equal(result.headers.get("cache-control"), "no-store");
  return { status: result.status, body: JSON.parse(text) as unknown };
}

async function expectError(response: Promise<Response>, status: number, code: string): Promise<void> {
  const { status: actual, body } = await read(response);
  assert.equal(actual, status, JSON.stringify(body));
  assert.equal(ApiError.parse(body).error.code, code);
}

test("every route runs on Node and is dynamic", () => {
  for (const route of [circuitRoute, resetRoute, runsRoute, progressRoute, circuitByIdRoute, runnerRoute, runByIdRoute]) {
    assert.equal(route.runtime, "nodejs");
    assert.equal(route.dynamic, "force-dynamic");
  }
});

test("a run goes from POST to a finished GET, then shows in history and progress, and reset clears progress", async () => {
  const { runner } = freshEnvironment();
  const started = await read(runsRoute.POST(post(`${course}/items/drive-high/runs`, { files: { "top_module.v": solution }, submit: true }), itemContext()));
  assert.equal(started.status, 202);
  const run = RunRecord.parse((started.body as { run: unknown }).run);
  assert.equal(run.state, "queued");
  assert.equal(run.kind, "submission");

  const pending = await read(runByIdRoute.GET(get(`/api/runs/${run.id}?wait=1000000`), idContext(run.id)));
  assert.equal(pending.status, 200);
  assert.equal(RunRecord.parse((pending.body as { run: unknown }).run).state, "queued");
  assert.equal(runner.waits.at(-1), MAX_WAIT_MS);

  runner.succeed(testResult(passReport()));
  const finished = await read(runByIdRoute.GET(get(`/api/runs/${run.id}`), idContext(run.id)));
  const done = RunRecord.parse((finished.body as { run: unknown }).run);
  assert.equal(done.state, "succeeded");
  assert.equal(runner.waits.at(-1), undefined);

  const history = await read(runsRoute.GET(get(`${course}/items/drive-high/runs`), itemContext()));
  assert.equal(history.status, 200);
  const page = RunHistoryPage.parse(history.body);
  assert.equal(page.total, 1);
  assert.equal(page.runs[0]?.id, run.id);
  assert.equal(page.nextCursor, null);

  const progress = await read(progressRoute.GET(get(`${course}/progress`), courseContext()));
  assert.equal(progress.status, 200);
  const parsed = CourseProgress.parse(progress.body);
  assert.equal(parsed.items["drive-high"]?.status, "completed");
  assert.equal(parsed.items["connect-wire"], undefined);

  const reset = await read(resetRoute.POST(post(`${course}/items/drive-high/reset`, ""), itemContext()));
  assert.equal(reset.status, 200);
  assert.deepEqual(ItemProgress.parse((reset.body as { progress: unknown }).progress), {
    status: "not-started",
    tasks: { "1": "untested", "2": "untested" },
    runs: 0,
  });
});

test("a run started while the runner is down comes back as 202 with a failed run", async () => {
  const { runner } = freshEnvironment();
  runner.unreachable = true;
  const response = await read(runsRoute.POST(post(`${course}/items/drive-high/runs`, { files: { "top_module.v": solution } }), itemContext()));
  assert.equal(response.status, 202);
  const run = RunRecord.parse((response.body as { run: unknown }).run);
  assert.equal(run.state, "failed");
  assert.equal(run.error?.kind, "unavailable");
});

test("a full runner queue answers 429 and stores no run", async () => {
  const { runner } = freshEnvironment();
  runner.busy = true;
  await expectError(runsRoute.POST(post(`${course}/items/drive-high/runs`, { files: { "top_module.v": solution } }), itemContext()), 429, "runner-busy");
  const history = await read(runsRoute.GET(get(`${course}/items/drive-high/runs`), itemContext()));
  assert.equal(RunHistoryPage.parse(history.body).total, 0);
});

test("bad requests get the right status and error code", async () => {
  const { runner } = freshEnvironment();
  const url = `${course}/items/drive-high/runs`;
  const files = { "top_module.v": solution };
  await expectError(runsRoute.POST(post(url, { files }, { "content-type": "text/plain" }), itemContext()), 415, "unsupported-media-type");
  await expectError(runsRoute.POST(post(url, "{not json"), itemContext()), 400, "invalid-json");
  await expectError(runsRoute.POST(post(url, { files, extra: 1 }), itemContext()), 400, "invalid-request");
  await expectError(runsRoute.POST(post(url, { files: { "../x.v": "x" } }), itemContext()), 400, "invalid-request");
  await expectError(runsRoute.POST(post(url, { files: { "defs.vh": "x", ...files } }), itemContext()), 400, "invalid-files");
  await expectError(runsRoute.POST(post(url, { files, taskId: 9 }), itemContext()), 400, "invalid-task");
  await expectError(runsRoute.POST(post(url, { files, taskId: 1, submit: true }), itemContext()), 400, "invalid-task");
  await expectError(runsRoute.POST(post(url, "x".repeat(1024 * 1024 + 1)), itemContext()), 413, "payload-too-large");
  await expectError(runsRoute.POST(post(url, { files }), itemContext("missing")), 404, "not-found");
  await expectError(runsRoute.POST(post(url, { files }), itemContext("drive-high", "Bad Space")), 404, "not-found");
  await expectError(runsRoute.POST(post(url, { files }), itemContext("drive-high", "test", "nothing")), 404, "not-found");
  await expectError(progressRoute.GET(get(`/api/courses/test/nothing/progress`), courseContext("test", "nothing")), 404, "not-found");
  await expectError(runsRoute.GET(get(`${url}?cursor=abc`), itemContext()), 400, "invalid-cursor");
  await expectError(runByIdRoute.GET(get("/api/runs/not-a-uuid"), idContext("not-a-uuid")), 404, "not-found");
  const unknown = "00000000-0000-4000-8000-000000000000";
  await expectError(runByIdRoute.GET(get(`/api/runs/${unknown}`), idContext(unknown)), 404, "not-found");
  await expectError(circuitByIdRoute.GET(get(`/api/circuits/${unknown}`), idContext(unknown)), 404, "not-found");
  await expectError(runByIdRoute.GET(get(`/api/runs/${unknown}?wait=-1`), idContext(unknown)), 400, "invalid-wait");
  assert.equal(runner.requests.length, 0);
});

test("run and circuit reads pass state and position on, and refuse values that are not valid", async () => {
  const { runner } = freshEnvironment();
  const started = await read(runsRoute.POST(post(`${course}/items/drive-high/runs`, { files: { "top_module.v": solution } }), itemContext()));
  const run = RunRecord.parse((started.body as { run: unknown }).run);
  assert.equal(run.position, 0);
  const getRun = async (query: string) => {
    const response = await read(runByIdRoute.GET(get(`/api/runs/${run.id}?${query}`), idContext(run.id)));
    assert.equal(response.status, 200, query);
    return RunRecord.parse((response.body as { run: unknown }).run);
  };

  // What the browser saw differs from the store: answered without asking the runner.
  const calls = runner.waits.length;
  assert.equal((await getRun("wait=5000&state=running")).state, "queued");
  assert.equal((await getRun("wait=5000&state=queued&position=2")).position, 0);
  assert.equal(runner.waits.length, calls);

  await getRun("wait=5000&state=queued&position=0");
  assert.deepEqual(runner.seens.at(-1), { state: "queued", position: 0 });
  await getRun("wait=5000&state=queued&position=");
  assert.deepEqual(runner.seens.at(-1), { state: "queued" });
  await getRun("wait=5000&state=&position=");
  assert.equal(runner.seens.at(-1), undefined);
  await getRun("wait=5000");
  assert.equal(runner.seens.at(-1), undefined);
  assert.equal(runner.waits.at(-1), 5000);

  const circuitStart = await read(circuitRoute.POST(post(`${course}/items/drive-high/circuit`, { files: { "top_module.v": solution } }), itemContext()));
  const circuit = CircuitRecord.parse((circuitStart.body as { circuit: unknown }).circuit);
  const circuitRead = await read(circuitByIdRoute.GET(get(`/api/circuits/${circuit.id}?wait=500&state=queued`), idContext(circuit.id)));
  assert.equal(circuitRead.status, 200);
  assert.deepEqual(runner.seens.at(-1), { state: "queued" });
  assert.equal(runner.waits.at(-1), 500);

  for (const query of ["state=waiting", "state=Queued", "state=queued&position=-1", "state=queued&position=1.5", "state=queued&position=x", "position=0"]) {
    await expectError(runByIdRoute.GET(get(`/api/runs/${run.id}?wait=5000&${query}`), idContext(run.id)), 400, "invalid-wait");
    await expectError(circuitByIdRoute.GET(get(`/api/circuits/${circuit.id}?wait=5000&${query}`), idContext(circuit.id)), 400, "invalid-wait");
  }
});

test("requests from another site or addressed to another host are refused", async () => {
  const { runner } = freshEnvironment();
  const url = `${course}/items/drive-high/runs`;
  const body = { files: { "top_module.v": solution } };
  await expectError(runsRoute.POST(post(url, body, { origin: "https://example.com" }), itemContext()), 403, "forbidden");
  await expectError(runsRoute.POST(post(url, body, { "sec-fetch-site": "cross-site" }), itemContext()), 403, "forbidden");
  await expectError(runsRoute.POST(post(url, body, { host: "attacker.example:3100" }), itemContext()), 403, "forbidden");
  await expectError(resetRoute.POST(post(`${course}/items/drive-high/reset`, "", { origin: "https://example.com" }), itemContext()), 403, "forbidden");
  await expectError(runsRoute.GET(get(url, { host: "attacker.example" }), itemContext()), 403, "forbidden");
  assert.equal(runner.requests.length, 0);
  // localhost and a same-origin browser request are accepted.
  const local = await read(runsRoute.POST(post(url, body, { host: "localhost:3100", origin: "http://localhost:3100", "sec-fetch-site": "same-origin" }), itemContext()));
  assert.equal(local.status, 202);
});

test("circuits start with 202, read with 200, and are refused where there is no circuit view", async () => {
  const { runner } = freshEnvironment();
  const started = await read(circuitRoute.POST(post(`${course}/items/drive-high/circuit`, { files: { "top_module.v": solution } }), itemContext()));
  assert.equal(started.status, 202);
  const circuit = CircuitRecord.parse((started.body as { circuit: unknown }).circuit);
  runner.succeed({ kind: "circuit", circuit: { devices: {} }, ports: [], warnings: "", imageId: "sha256:x", durationMs: 1 });
  const read1 = await read(circuitByIdRoute.GET(get(`/api/circuits/${circuit.id}?wait=500`), idContext(circuit.id)));
  assert.equal(read1.status, 200);
  assert.equal(CircuitRecord.parse((read1.body as { circuit: unknown }).circuit).state, "succeeded");
  assert.equal(runner.waits.at(-1), 500);
  await expectError(circuitRoute.POST(post(`${course}/items/${PLAIN_ITEM.slug}/circuit`, { files: { "top_module.v": solution } }), itemContext(PLAIN_ITEM.slug)), 409, "no-schematic");
  await expectError(
    circuitRoute.POST(post(`/api/courses/test/bare/items/${PLAIN_ITEM.slug}/circuit`, { files: { "top_module.v": solution } }), itemContext(PLAIN_ITEM.slug, "test", "bare")),
    404,
    "no-circuit",
  );
});

test("runner health is passed through, or 503 when the runner cannot be reached", async () => {
  const { runner } = freshEnvironment();
  const healthy = await read(runnerRoute.GET(get("/api/runner")));
  assert.equal(healthy.status, 200);
  assert.equal(RunnerHealth.parse(healthy.body).status, "ok");
  runner.unreachable = true;
  await expectError(runnerRoute.GET(get("/api/runner")), 503, "runner-unavailable");
});

test("a missing content index answers 503", async () => {
  freshEnvironment();
  process.env.COMPASS_CONTENT_INDEX = path.join(path.dirname(process.env.COMPASS_DATA_DIR ?? "."), "absent.json");
  const original = console.error;
  console.error = () => undefined;
  try {
    await expectError(progressRoute.GET(get(`${course}/progress`), courseContext()), 503, "content-unavailable");
  } finally {
    console.error = original;
  }
});
