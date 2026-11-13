import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { RunnerRequestError, RunnerUnavailableError, createRunnerClient } from "@compass/runner-client";
import { PASSING_RESULT, settle, startServer, testRequest } from "./helpers.ts";

async function closedPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  if (!address || typeof address === "string") throw new Error("No port.");
  return address.port;
}

test("the client submits, reads, waits for and cancels jobs", async (t) => {
  const service = await startServer({ concurrency: 1 });
  t.after(() => service.close());
  const client = createRunnerClient({ url: service.url + "/" });
  assert.equal(client.url, service.url);

  const health = await client.health();
  assert.equal(health.queue.concurrency, 1);
  assert.equal(health.runners.length, 2);

  const job = await client.submit(testRequest());
  assert.equal(job.state, "running");
  const queued = await client.submit(testRequest({ taskId: 1 }));
  assert.equal(queued.position, 0);
  assert.equal((await client.get(job.id))?.state, "running");

  const finished = client.waitFor(job.id, { timeoutMs: 5000 });
  await settle();
  service.fake.call(0).resolve(PASSING_RESULT);
  const done = await finished;
  assert.equal(done.state, "succeeded");
  assert.deepEqual(done.result, PASSING_RESULT);

  assert.equal((await client.get(queued.id, { waitMs: 20 }))?.state, "running");
  assert.equal((await client.cancel(queued.id))?.state, "cancelled");
  assert.equal(await client.get("unknown"), undefined);
  assert.equal(await client.cancel("unknown"), undefined);
});

test("the client's read with seen returns when the job moves on", async (t) => {
  const service = await startServer({ concurrency: 1 });
  t.after(() => service.close());
  const client = createRunnerClient({ url: service.url });
  await client.submit(testRequest());
  const queued = await client.submit(testRequest());
  assert.equal(queued.position, 0);
  const held = client.get(queued.id, { waitMs: 5000, seen: { state: "queued", position: 0 } });
  await settle();
  service.fake.call(0).resolve(PASSING_RESULT);
  assert.equal((await held)?.state, "running");
  const started = Date.now();
  assert.equal((await client.get(queued.id, { waitMs: 5000, seen: { state: "queued" } }))?.state, "running");
  assert.ok(Date.now() - started < 1000);
  await assert.rejects(
    client.get(queued.id, { waitMs: 100, seen: { state: "queued", position: -1 } }),
    (error) => error instanceof RunnerRequestError && error.status === 400 && error.code === "invalid-wait",
  );
});

test("the client rejects error responses with RunnerRequestError", async (t) => {
  const service = await startServer({ concurrency: 1, capacity: 1 });
  t.after(() => service.close());
  const client = createRunnerClient({ url: service.url });
  await assert.rejects(client.submit(testRequest({ taskId: 9 })), (error) => {
    assert.ok(error instanceof RunnerRequestError);
    assert.equal(error.status, 400);
    assert.equal(error.code, "invalid-request");
    return true;
  });
  await client.submit(testRequest());
  await client.submit(testRequest());
  await assert.rejects(
    client.submit(testRequest()),
    (error) => error instanceof RunnerRequestError && error.status === 429 && error.code === "queue-full",
  );
  await assert.rejects(
    client.waitFor("unknown"),
    (error) => error instanceof RunnerRequestError && error.code === "not-found",
  );
});

test("waitFor gives up with wait-timeout", async (t) => {
  const service = await startServer();
  t.after(() => service.close());
  const client = createRunnerClient({ url: service.url });
  const job = await client.submit(testRequest());
  await assert.rejects(
    client.waitFor(job.id, { timeoutMs: 50 }),
    (error) => error instanceof RunnerRequestError && error.code === "wait-timeout",
  );
});

test("the client reports an unreachable service with RunnerUnavailableError", async () => {
  const url = `http://127.0.0.1:${await closedPort()}`;
  const client = createRunnerClient({ url });
  await assert.rejects(client.health(), (error) => error instanceof RunnerUnavailableError && error.url === url);
  await assert.rejects(client.submit(testRequest()), RunnerUnavailableError);
  await assert.rejects(client.get("x"), RunnerUnavailableError);
});
