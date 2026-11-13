import assert from "node:assert/strict";
import test from "node:test";
import { followJob, phaseOf, RequestError, type JobLike, type JobPhase } from "../../src/lib/job-poll.ts";

type Job = JobLike & { note?: string };

function script(records: (Job | Error)[]) {
  const calls: { id: string; waitMs: number }[] = [];
  return {
    calls,
    get: async (id: string, waitMs: number) => {
      calls.push({ id, waitMs });
      const next = records.shift();
      if (!next) throw new Error("No more records");
      if (next instanceof Error) throw next;
      return next;
    },
  };
}

const noSleep = async () => {};

function phases(list: JobPhase<Job>[]) {
  return list.map((phase) =>
    phase.phase === "queued" ? `queued${phase.position === undefined ? "" : `:${phase.position}`}` : phase.phase,
  );
}

test("a run goes from queued with its position through running to finished", async () => {
  const seen: JobPhase<Job>[] = [];
  const server = script([
    { id: "r1", state: "queued", position: 1 },
    { id: "r1", state: "queued", position: 0 },
    { id: "r1", state: "running" },
    { id: "r1", state: "running" },
    { id: "r1", state: "succeeded", note: "done" },
  ]);
  const final = await followJob<Job>({
    start: async () => ({ id: "r1", state: "queued", position: 2 }),
    get: server.get,
    onPhase: (phase) => seen.push(phase),
    sleep: noSleep,
  });
  assert.deepEqual(phases(seen), ["starting", "queued:2", "queued:1", "queued:0", "running", "finished"]);
  assert.equal(final.phase, "finished");
  assert.equal(final.phase === "finished" && final.record.note, "done");
  assert.deepEqual(server.calls[0], { id: "r1", waitMs: 5000 });
});

test("a record that is already terminal ends at once", async () => {
  const seen: JobPhase<Job>[] = [];
  const final = await followJob<Job>({
    start: async () => ({ id: "r2", state: "failed" }),
    get: async () => assert.fail("no read is needed"),
    onPhase: (phase) => seen.push(phase),
  });
  assert.deepEqual(phases(seen), ["starting", "finished"]);
  assert.equal(final.phase, "finished");
});

test("a rejected start is an error with the server's message", async () => {
  const final = await followJob<Job>({
    start: async () => {
      throw new RequestError("The item changed.", 409);
    },
    get: async () => assert.fail("no read after a failed start"),
    onPhase: () => {},
  });
  assert.deepEqual(final, { phase: "error", message: "The item changed.", status: 409 });
});

test("reads that fail are retried, and a read that succeeds resets the count", async () => {
  const unreachable = new RequestError("The server could not be reached.");
  const server = script([
    unreachable,
    { id: "r3", state: "running" },
    unreachable,
    unreachable,
    { id: "r3", state: "cancelled" },
  ]);
  const delays: number[] = [];
  const final = await followJob<Job>({
    start: async () => ({ id: "r3", state: "queued" }),
    get: server.get,
    onPhase: () => {},
    retries: 2,
    sleep: async (ms) => {
      delays.push(ms);
    },
    minIntervalMs: 0,
  });
  assert.equal(final.phase, "finished");
  assert.deepEqual(delays, [500, 500, 1000]);
});

test("too many failed reads in a row end in an error that keeps the last record", async () => {
  const server = script([new RequestError("Bad gateway", 502), new RequestError("Bad gateway", 502)]);
  const final = await followJob<Job>({
    start: async () => ({ id: "r4", state: "queued", position: 0 }),
    get: server.get,
    onPhase: () => {},
    retries: 1,
    sleep: noSleep,
  });
  assert.equal(final.phase, "error");
  assert.equal(final.phase === "error" && final.status, 502);
  assert.equal(final.phase === "error" && final.record?.id, "r4");
});

test("a read the server rejects is not retried", async () => {
  const server = script([new RequestError("Unknown run", 404)]);
  const final = await followJob<Job>({
    start: async () => ({ id: "r5", state: "queued" }),
    get: server.get,
    onPhase: () => {},
    sleep: noSleep,
  });
  assert.equal(final.phase, "error");
  assert.equal(server.calls.length, 1);
});

test("a server that answers at once is not asked again before the minimum interval", async () => {
  const server = script([
    { id: "r6", state: "running" },
    { id: "r6", state: "succeeded" },
  ]);
  const pauses: number[] = [];
  let clock = 0;
  await followJob<Job>({
    start: async () => ({ id: "r6", state: "queued" }),
    get: async (id, wait) => {
      clock += 100;
      return server.get(id, wait);
    },
    onPhase: () => {},
    now: () => clock,
    minIntervalMs: 400,
    sleep: async (ms) => {
      pauses.push(ms);
    },
  });
  assert.deepEqual(pauses, [300]);
});

test("aborting stops the poll and reports nothing more", async () => {
  const controller = new AbortController();
  const seen: string[] = [];
  const promise = followJob<Job>({
    start: async () => ({ id: "r7", state: "queued" }),
    get: async () => {
      controller.abort(new Error("left the page"));
      return { id: "r7", state: "running" };
    },
    onPhase: (phase) => seen.push(phase.phase),
    signal: controller.signal,
    sleep: noSleep,
  });
  await assert.rejects(promise, /left the page/);
  assert.deepEqual(seen, ["starting", "queued"]);
});

test("the phase of a record follows its state", () => {
  assert.deepEqual(phaseOf({ id: "a", state: "queued", position: 3 }), {
    phase: "queued",
    record: { id: "a", state: "queued", position: 3 },
    position: 3,
  });
  assert.equal(phaseOf({ id: "a", state: "running" }).phase, "running");
  for (const state of ["succeeded", "failed", "cancelled"] as const)
    assert.equal(phaseOf({ id: "a", state }).phase, "finished");
});
