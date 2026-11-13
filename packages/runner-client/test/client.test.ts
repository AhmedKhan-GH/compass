import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_RUNNER_URL } from "@compass/schema";
import { RunnerRequestError, RunnerUnavailableError, createRunnerClient } from "../src/index.ts";

const job = {
  id: "j1",
  runner: "iverilog-cocotb@1",
  state: "queued",
  createdAt: "2026-11-13T12:00:00.000Z",
  position: 0,
};

function fakeFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init });
    return respond(url, init);
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("the URL comes from the option, then COMPASS_RUNNER_URL, then the default", (t) => {
  const saved = process.env.COMPASS_RUNNER_URL;
  t.after(() => {
    if (saved === undefined) delete process.env.COMPASS_RUNNER_URL;
    else process.env.COMPASS_RUNNER_URL = saved;
  });
  delete process.env.COMPASS_RUNNER_URL;
  assert.equal(createRunnerClient().url, DEFAULT_RUNNER_URL);
  process.env.COMPASS_RUNNER_URL = "http://127.0.0.1:3111/";
  assert.equal(createRunnerClient().url, "http://127.0.0.1:3111");
  assert.equal(createRunnerClient({ url: "http://127.0.0.1:4000" }).url, "http://127.0.0.1:4000");
});

test("requests carry JSON, the job id is encoded and the wait is capped", async () => {
  const { calls, fetch } = fakeFetch(() => json(200, { job }));
  const client = createRunnerClient({ url: "http://runner", fetch });
  await client.get("a/b", { waitMs: 99_999 });
  await client.cancel("j1");
  assert.equal(calls[0]?.url, "http://runner/v1/jobs/a%2Fb?wait=30000");
  assert.equal(calls[1]?.init.method, "DELETE");
  const submit = fakeFetch(() => json(202, { job }));
  await createRunnerClient({ url: "http://runner", fetch: submit.fetch }).submit({
    runner: "yosys-digitaljs@1",
    top: "top_module",
    solution: "top_module.v",
    files: { "top_module.v": "module top_module; endmodule" },
  });
  const headers = new Headers(submit.calls[0]?.init.headers);
  assert.equal(headers.get("content-type"), "application/json");
  assert.equal(submit.calls[0]?.init.method, "POST");
});

test("a read with seen carries the state and position after the wait", async () => {
  const { calls, fetch } = fakeFetch(() => json(200, { job }));
  const client = createRunnerClient({ url: "http://runner", fetch });
  await client.get("j1", { waitMs: 25_000, seen: { state: "queued", position: 2 } });
  await client.get("j1", { waitMs: 25_000, seen: { state: "queued", position: 0 } });
  await client.get("j1", { waitMs: 25_000, seen: { state: "running" } });
  await client.get("j1", { seen: { state: "queued", position: 1 } });
  await client.get("j1", { waitMs: 25_000 });
  await client.get("j1");
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "http://runner/v1/jobs/j1?wait=25000&state=queued&position=2",
      "http://runner/v1/jobs/j1?wait=25000&state=queued&position=0",
      "http://runner/v1/jobs/j1?wait=25000&state=running",
      "http://runner/v1/jobs/j1?state=queued&position=1",
      "http://runner/v1/jobs/j1?wait=25000",
      "http://runner/v1/jobs/j1",
    ],
  );
});

test("responses of the wrong shape and error bodies become RunnerRequestError", async () => {
  const cases: [Response, number, string][] = [
    [json(200, { job: { id: "j1" } }), 200, "invalid-response"],
    [json(400, { error: { code: "invalid-request", message: "Bad." } }), 400, "invalid-request"],
    [new Response("<html>oops</html>", { status: 502 }), 502, "http-502"],
  ];
  for (const [response, status, code] of cases) {
    const client = createRunnerClient({ url: "http://runner", fetch: fakeFetch(() => response).fetch });
    await assert.rejects(client.get("j1"), (error) => {
      assert.ok(error instanceof RunnerRequestError);
      assert.equal(error.status, status);
      assert.equal(error.code, code);
      return true;
    });
  }
  const missing = createRunnerClient({
    url: "http://runner",
    fetch: fakeFetch(() => json(404, { error: { code: "not-found", message: "Gone." } })).fetch,
  });
  assert.equal(await missing.get("j1"), undefined);
  await assert.rejects(missing.health(), (error) => error instanceof RunnerRequestError && error.status === 404);
});

test("a network failure becomes RunnerUnavailableError, and the caller's abort stays an abort", async () => {
  const failing = fakeFetch(() => Promise.reject(new TypeError("fetch failed")));
  const client = createRunnerClient({ url: "http://runner", fetch: failing.fetch });
  await assert.rejects(client.health(), (error) => {
    assert.ok(error instanceof RunnerUnavailableError);
    assert.ok(error.cause instanceof TypeError);
    return true;
  });
  const controller = new AbortController();
  controller.abort(new Error("Navigated away."));
  await assert.rejects(client.get("j1", { signal: controller.signal }), /Navigated away/);
});
