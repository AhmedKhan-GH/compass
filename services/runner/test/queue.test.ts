import test from "node:test";
import assert from "node:assert/strict";
import { JobFailure } from "../src/failure.ts";
import { JobQueue, QueueClosedError, QueueFullError } from "../src/queue.ts";
import { ManualExecutor, PASSING_RESULT, circuitRequest, settle, testRequest } from "./helpers.ts";

function setup(
  options: { concurrency?: number; capacity?: number; retentionMs?: number; rejectOnAbort?: boolean } = {},
) {
  const { rejectOnAbort, ...queueOptions } = options;
  const fake = new ManualExecutor(rejectOnAbort);
  let clock = Date.parse("2026-11-13T12:00:00.000Z");
  let ids = 0;
  const queue = new JobQueue({
    executor: fake.executor,
    now: () => clock,
    createId: () => `job-${++ids}`,
    ...queueOptions,
  });
  return { fake, queue, advance: (ms: number) => (clock += ms) };
}

test("jobs start in submission order and no more than the concurrency run at once", async () => {
  const { fake, queue } = setup({ concurrency: 2 });
  const jobs = [1, 2, 3, 4].map((n) => queue.submit(testRequest({ top: `top_${n}` })));
  assert.deepEqual(
    jobs.map((job) => [job.state, job.position]),
    [
      ["running", undefined],
      ["running", undefined],
      ["queued", 0],
      ["queued", 1],
    ],
  );
  assert.deepEqual(queue.counts(), { queued: 2, running: 2, concurrency: 2, capacity: 32 });
  assert.deepEqual(
    fake.calls.map((call) => call.request.top),
    ["top_1", "top_2"],
  );

  fake.call(1).resolve(PASSING_RESULT);
  await settle();
  assert.equal(queue.get("job-2")?.state, "succeeded");
  assert.equal(queue.get("job-3")?.state, "running");
  assert.equal(queue.get("job-4")?.position, 0, "The position counts the jobs still ahead.");
  assert.deepEqual(
    fake.calls.map((call) => call.request.top),
    ["top_1", "top_2", "top_3"],
  );

  fake.call(0).resolve(PASSING_RESULT);
  fake.call(2).resolve(PASSING_RESULT);
  await settle();
  fake.call(3).resolve(PASSING_RESULT);
  await settle();
  assert.deepEqual(queue.counts(), { queued: 0, running: 0, concurrency: 2, capacity: 32 });
  for (const id of ["job-1", "job-2", "job-3", "job-4"]) {
    const job = queue.get(id);
    assert.equal(job?.state, "succeeded");
    assert.deepEqual(job.result, PASSING_RESULT);
    assert.ok(job.startedAt && job.finishedAt);
    assert.equal(job.position, undefined);
  }
});

test("a submission beyond the queue capacity is refused, and running jobs do not count against it", () => {
  const { queue } = setup({ concurrency: 1, capacity: 2 });
  queue.submit(testRequest());
  queue.submit(testRequest());
  queue.submit(testRequest());
  assert.throws(() => queue.submit(circuitRequest()), QueueFullError);
  assert.deepEqual(queue.counts(), { queued: 2, running: 1, concurrency: 1, capacity: 2 });
});

test("cancelling a queued job removes it before it runs", async () => {
  const { fake, queue } = setup({ concurrency: 1 });
  queue.submit(testRequest());
  queue.submit(testRequest());
  queue.submit(testRequest());
  const cancelled = queue.cancel("job-2");
  assert.equal(cancelled?.state, "cancelled");
  assert.ok(cancelled.finishedAt);
  assert.equal(queue.get("job-3")?.position, 0);
  fake.call(0).resolve(PASSING_RESULT);
  await settle();
  assert.equal(fake.calls.length, 2);
  assert.equal(fake.call(1).jobId, "job-3", "The cancelled job never reaches the executor.");
});

test("cancelling a running job aborts its executor and frees the worker once the executor settles", async () => {
  const { fake, queue } = setup({ concurrency: 1, rejectOnAbort: false });
  queue.submit(testRequest());
  queue.submit(testRequest());
  const cancelled = queue.cancel("job-1");
  assert.equal(cancelled?.state, "cancelled");
  assert.equal(fake.call(0).signal.aborted, true);
  assert.equal(queue.get("job-2")?.state, "queued", "The container is still being removed.");

  // The executor resolving after the cancel does not revive the job.
  fake.call(0).resolve(PASSING_RESULT);
  await settle();
  assert.equal(queue.get("job-1")?.state, "cancelled");
  assert.equal(queue.get("job-1")?.result, undefined);
  assert.equal(queue.get("job-2")?.state, "running");
});

test("cancelling a finished or unknown job changes nothing", async () => {
  const { fake, queue } = setup();
  queue.submit(testRequest());
  fake.call(0).resolve(PASSING_RESULT);
  await settle();
  assert.equal(queue.cancel("job-1")?.state, "succeeded");
  assert.equal(queue.cancel("missing"), undefined);
});

test("executor failures become job errors of the right kind", async () => {
  const { fake, queue } = setup({ concurrency: 4 });
  for (let i = 0; i < 4; i++) queue.submit(testRequest());
  fake.call(0).reject(new JobFailure("timeout", "Too slow."));
  fake.call(1).reject(new JobFailure("design", "Syntax error.", "line 3"));
  fake.call(2).reject(new Error("boom"));
  fake.call(3).resolve({ ...PASSING_RESULT, durationMs: -1 });
  await settle();
  assert.deepEqual(queue.get("job-1")?.error, { kind: "timeout", message: "Too slow." });
  assert.deepEqual(queue.get("job-2")?.error, { kind: "design", message: "Syntax error.", diagnostics: "line 3" });
  assert.equal(queue.get("job-3")?.error?.kind, "execution");
  assert.equal(queue.get("job-4")?.error?.kind, "invalid-result");
  for (const id of ["job-1", "job-2", "job-3", "job-4"]) {
    assert.equal(queue.get(id)?.state, "failed");
    assert.equal(queue.get(id)?.result, undefined);
  }
});

test("finished jobs are forgotten after the retention period", async () => {
  const { fake, queue, advance } = setup({ retentionMs: 1000 });
  queue.submit(testRequest());
  queue.submit(testRequest());
  fake.call(0).resolve(PASSING_RESULT);
  await settle();
  advance(999);
  assert.equal(queue.get("job-1")?.state, "succeeded");
  advance(1);
  assert.equal(queue.get("job-1"), undefined);
  assert.equal(queue.get("job-2")?.state, "running", "A job that has not finished is kept.");
});

test("wait resolves when the job finishes, or with the current job when the wait ends", async () => {
  const { fake, queue } = setup();
  queue.submit(testRequest());
  const waiting = queue.wait("job-1", 10_000);
  await settle();
  fake.call(0).resolve(PASSING_RESULT);
  assert.equal((await waiting)?.state, "succeeded");

  queue.submit(testRequest());
  const started = Date.now();
  const timedOut = await queue.wait("job-2", 30);
  assert.equal(timedOut?.state, "running");
  assert.ok(Date.now() - started >= 25);

  assert.equal(await queue.wait("missing", 1000), undefined);
  const aborted = new AbortController();
  const held = queue.wait("job-2", 10_000, aborted.signal);
  aborted.abort();
  assert.equal((await held)?.state, "running");

  const cancelling = queue.wait("job-2", 10_000);
  queue.cancel("job-2");
  assert.equal((await cancelling)?.state, "cancelled");
});

test("close cancels every job and refuses new ones", async () => {
  const { fake, queue } = setup({ concurrency: 1 });
  queue.submit(testRequest());
  queue.submit(testRequest());
  await queue.close();
  assert.equal(fake.call(0).signal.aborted, true);
  assert.equal(queue.get("job-1")?.state, "cancelled");
  assert.equal(queue.get("job-2")?.state, "cancelled");
  assert.equal(fake.calls.length, 1);
  assert.throws(() => queue.submit(testRequest()), QueueClosedError);
});

test("the queue refuses a concurrency or capacity that is not a positive integer", () => {
  const executor = new ManualExecutor().executor;
  assert.throws(() => new JobQueue({ executor, concurrency: 0 }), RangeError);
  assert.throws(() => new JobQueue({ executor, capacity: 1.5 }), RangeError);
});
