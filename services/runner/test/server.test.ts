import test from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { ApiError, JobResponse, RunnerHealth } from "@compass/schema";
import { IMAGE_ID, PASSING_RESULT, circuitRequest, settle, startServer, testRequest } from "./helpers.ts";

async function call(url: string, init: RequestInit & { json?: unknown } = {}) {
  const { json, ...rest } = init;
  const response = await fetch(url, {
    ...rest,
    ...(json === undefined ? {} : { body: JSON.stringify(json), headers: { "content-type": "application/json" } }),
  });
  return { status: response.status, headers: response.headers, body: (await response.json()) as unknown };
}

function errorCode(body: unknown): string {
  return ApiError.parse(body).error.code;
}

test("the API listens on 127.0.0.1 and reports the runner kinds and the queue", async (t) => {
  const service = await startServer({ concurrency: 3, capacity: 5 });
  t.after(() => service.close());
  assert.equal(service.address.address, "127.0.0.1");
  const { status, body } = await call(`${service.url}/v1/health`);
  assert.equal(status, 200);
  assert.deepEqual(RunnerHealth.parse(body), {
    status: "ok",
    runners: [
      {
        kind: "iverilog-cocotb@1",
        purpose: "test",
        image: "compass/iverilog-cocotb:1",
        available: true,
        imageId: IMAGE_ID,
      },
      { kind: "yosys-digitaljs@1", purpose: "circuit", image: "compass/yosys-digitaljs:1", available: false },
      { kind: "iverilog-native@1", purpose: "test", image: "compass/iverilog-native:1", available: false },
      { kind: "ghdl-cocotb@1", purpose: "test", image: "compass/ghdl-cocotb:1", available: false },
      { kind: "ghdl-native@1", purpose: "test", image: "compass/ghdl-native:1", available: false },
      { kind: "ghdl-yosys-digitaljs@1", purpose: "circuit", image: "compass/ghdl-yosys-digitaljs:1", available: false },
    ],
    queue: { queued: 0, running: 0, concurrency: 3, capacity: 5 },
  });
});

test("a job is queued, read, held with wait until it finishes, and cancelled", async (t) => {
  const service = await startServer({ concurrency: 1 });
  t.after(() => service.close());
  const first = await call(`${service.url}/v1/jobs`, { method: "POST", json: testRequest() });
  assert.equal(first.status, 202);
  const job = JobResponse.parse(first.body).job;
  assert.equal(job.state, "running");
  assert.equal(job.runner, "iverilog-cocotb@1");

  const second = JobResponse.parse(
    (await call(`${service.url}/v1/jobs`, { method: "POST", json: circuitRequest() })).body,
  ).job;
  assert.equal(second.state, "queued");
  assert.equal(second.position, 0);

  const read = await call(`${service.url}/v1/jobs/${job.id}`);
  assert.equal(read.status, 200);
  assert.equal(JobResponse.parse(read.body).job.state, "running");

  const held = call(`${service.url}/v1/jobs/${job.id}?wait=5000`);
  await settle();
  service.fake.call(0).resolve(PASSING_RESULT);
  const finished = JobResponse.parse((await held).body).job;
  assert.equal(finished.state, "succeeded");
  assert.deepEqual(finished.result, PASSING_RESULT);

  const cancelled = await call(`${service.url}/v1/jobs/${second.id}`, { method: "DELETE" });
  assert.equal(cancelled.status, 200);
  assert.equal(JobResponse.parse(cancelled.body).job.state, "cancelled");
  await settle();
  assert.equal(service.fake.call(1).signal.aborted, true);
});

test("a wait that ends before the job returns the job as it is", async (t) => {
  const service = await startServer();
  t.after(() => service.close());
  const job = JobResponse.parse(
    (await call(`${service.url}/v1/jobs`, { method: "POST", json: testRequest() })).body,
  ).job;
  const started = Date.now();
  const read = await call(`${service.url}/v1/jobs/${job.id}?wait=50`);
  assert.equal(JobResponse.parse(read.body).job.state, "running");
  assert.ok(Date.now() - started >= 45);
  for (const wait of ["-1", "abc", "1.5", "9999999999"]) {
    const invalid = await call(`${service.url}/v1/jobs/${job.id}?wait=${wait}`);
    assert.equal(invalid.status, 400, wait);
    assert.equal(errorCode(invalid.body), "invalid-wait");
  }
});

test("a wait with state and position returns as soon as the job differs from them", async (t) => {
  const service = await startServer({ concurrency: 1 });
  t.after(() => service.close());
  const submit = async () =>
    JobResponse.parse((await call(`${service.url}/v1/jobs`, { method: "POST", json: testRequest() })).body).job;
  const first = await submit();
  const second = await submit();
  const third = await submit();
  assert.equal(third.position, 1);
  const read = async (query: string) => {
    const response = await call(`${service.url}/v1/jobs/${third.id}?${query}`);
    assert.equal(response.status, 200, query);
    return JobResponse.parse(response.body).job;
  };

  // Held while the job is as seen; a cancel ahead of it moves it up.
  const moved = read("wait=5000&state=queued&position=1");
  await settle();
  await call(`${service.url}/v1/jobs/${second.id}`, { method: "DELETE" });
  const atFront = await moved;
  assert.equal(atFront.state, "queued");
  assert.equal(atFront.position, 0);

  // Held until it starts.
  const starting = read("wait=5000&state=queued&position=0");
  await settle();
  service.fake.call(0).resolve(PASSING_RESULT);
  assert.equal((await starting).state, "running");
  assert.equal(JobResponse.parse((await call(`${service.url}/v1/jobs/${first.id}`)).body).job.state, "succeeded");

  // Already different: answered at once, well within the wait.
  let started = Date.now();
  assert.equal((await read("wait=5000&state=queued&position=0")).state, "running");
  assert.equal((await read("wait=5000&state=queued")).state, "running");
  assert.ok(Date.now() - started < 1000);

  // As seen until the wait ends.
  started = Date.now();
  assert.equal((await read("wait=50&state=running")).state, "running");
  assert.ok(Date.now() - started >= 45);

  // Held until it ends.
  const ending = read("wait=5000&state=running");
  await settle();
  service.fake.call(1).resolve(PASSING_RESULT);
  assert.equal((await ending).state, "succeeded");
  started = Date.now();
  assert.equal((await read("wait=5000&state=succeeded")).state, "succeeded");
  assert.ok(Date.now() - started < 1000);
});

test("a state or position that is not valid answers 400 invalid-wait", async (t) => {
  const service = await startServer();
  t.after(() => service.close());
  const job = JobResponse.parse(
    (await call(`${service.url}/v1/jobs`, { method: "POST", json: testRequest() })).body,
  ).job;
  for (const query of [
    "wait=100&state=waiting",
    "wait=100&state=",
    "wait=100&state=QUEUED",
    "wait=100&state=queued&position=-1",
    "wait=100&state=queued&position=1.5",
    "wait=100&state=queued&position=abc",
    "wait=100&state=queued&position=",
    "wait=100&position=0",
  ]) {
    const invalid = await call(`${service.url}/v1/jobs/${job.id}?${query}`);
    assert.equal(invalid.status, 400, query);
    assert.equal(errorCode(invalid.body), "invalid-wait");
  }
  const unknown = await call(`${service.url}/v1/jobs/unknown?wait=100&state=nothing`);
  assert.equal(unknown.status, 400, "The query is checked before the job is looked up.");
});

test("invalid requests are refused with 400 and an error body", async (t) => {
  const service = await startServer();
  t.after(() => service.close());
  const cases: [unknown, RegExp][] = [
    [{ runner: "iverilog-cocotb@2" }, /invalid/],
    [{ ...testRequest(), extra: true }, /invalid/],
    [testRequest({ top: "1bad" }), /top/],
    [testRequest({ files: { "../escape.v": "x" } }), /files/],
    [testRequest({ files: { "top_module.v": "x".repeat(64 * 1024 + 1) } }), /files/],
    [testRequest({ taskId: 2 }), /task ID/],
    [testRequest({ itemKind: "practice", taskId: 1 }), /task ID/],
    [testRequest({ solution: "missing.v" }), /not among the files/],
    [testRequest({ checks: { name: "top_module.v", content: "x" } }), /case is ignored/],
    [
      {
        ...circuitRequest(),
        solution: "__proto__",
        files: JSON.parse('{"__proto__": "module m; endmodule"}') as unknown,
      },
      /Reserved name|not among the files/,
    ],
  ];
  for (const [json, message] of cases) {
    const { status, body } = await call(`${service.url}/v1/jobs`, { method: "POST", json });
    assert.equal(status, 400, JSON.stringify(json).slice(0, 80));
    const error = ApiError.parse(body).error;
    assert.equal(error.code, "invalid-request");
    assert.match(error.message, message);
  }
  const notJson = await call(`${service.url}/v1/jobs`, {
    method: "POST",
    body: "{",
    headers: { "content-type": "application/json" },
  });
  assert.equal(notJson.status, 400);
  assert.equal(errorCode(notJson.body), "invalid-json");
  const plainText = await call(`${service.url}/v1/jobs`, { method: "POST", body: JSON.stringify(testRequest()) });
  assert.equal(plainText.status, 415);
  assert.equal(errorCode(plainText.body), "unsupported-media-type");
  assert.equal(service.fake.calls.length, 0);
});

test("a body over the limit is refused with 413", async (t) => {
  const service = await startServer({ maxBodyBytes: 1024 });
  t.after(() => service.close());
  const declared = await new Promise<{ status: number; body: string }>((resolve, reject) => {
    const req = httpRequest(
      `${service.url}/v1/jobs`,
      { method: "POST", headers: { "content-type": "application/json", "content-length": "4096" } },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on("error", reject);
    req.end();
  });
  assert.equal(declared.status, 413);
  assert.equal(errorCode(JSON.parse(declared.body)), "body-too-large");

  const streamed = await call(`${service.url}/v1/jobs`, {
    method: "POST",
    json: testRequest({ files: { "top_module.v": "x".repeat(2048) } }),
  }).catch(() => undefined);
  // The server answers before reading the whole body; the client may see the 413 or a reset connection.
  if (streamed) assert.equal(streamed.status, 413);
  assert.equal(service.fake.calls.length, 0);
});

test("a full queue answers 429", async (t) => {
  const service = await startServer({ concurrency: 1, capacity: 1 });
  t.after(() => service.close());
  for (const expected of [202, 202, 429]) {
    const { status, body, headers } = await call(`${service.url}/v1/jobs`, { method: "POST", json: testRequest() });
    assert.equal(status, expected);
    if (expected === 429) {
      assert.equal(errorCode(body), "queue-full");
      assert.equal(headers.get("retry-after"), "1");
    }
  }
});

test("unknown jobs and routes answer 404, and the wrong method 405", async (t) => {
  const service = await startServer();
  t.after(() => service.close());
  for (const [path, method, status, code] of [
    ["/v1/jobs/unknown", "GET", 404, "not-found"],
    ["/v1/jobs/unknown", "DELETE", 404, "not-found"],
    ["/v1/jobs/%E0%A4%A", "GET", 404, "not-found"],
    ["/v1/nothing", "GET", 404, "not-found"],
    ["/", "GET", 404, "not-found"],
    ["/v1/health", "POST", 405, "method-not-allowed"],
    ["/v1/jobs", "GET", 405, "method-not-allowed"],
    ["/v1/jobs/unknown", "PUT", 405, "method-not-allowed"],
  ] as const) {
    const response = await call(`${service.url}${path}`, { method });
    assert.equal(response.status, status, `${method} ${path}`);
    assert.equal(errorCode(response.body), code);
  }
});

test("a closed queue answers 503", async (t) => {
  const service = await startServer();
  t.after(() => service.close());
  await service.queue.close();
  const { status, body } = await call(`${service.url}/v1/jobs`, { method: "POST", json: testRequest() });
  assert.equal(status, 503);
  assert.equal(errorCode(body), "shutting-down");
});
