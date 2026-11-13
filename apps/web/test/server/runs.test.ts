import assert from "node:assert/strict";
import { test } from "node:test";
import type { TestJobRequest } from "@compass/schema";
import { findIndexedItem } from "../../src/server/content.ts";
import { database } from "../../src/server/db.ts";
import { HttpError } from "../../src/server/http.ts";
import { LOG_BYTES, WAVEFORM_BYTES } from "../../src/server/jobs.ts";
import { itemProgress } from "../../src/server/progress.ts";
import { HISTORY_PAGE_SIZE, RUNS_KEPT_PER_ITEM, readRun, runHistory, startRun } from "../../src/server/runs.ts";
import {
  CHECKS_MARKER,
  COURSE_ID,
  IMAGE_ID,
  PLAIN_ITEM,
  TASKS_ITEM,
  freshEnvironment,
  passReport,
  testResult,
} from "./fixture.ts";

const solution = "module top_module(output out); assign out = 1'b1; endmodule\n";

function found(slug = TASKS_ITEM.slug) {
  const item = findIndexedItem(COURSE_ID, slug);
  assert.ok(item);
  return item;
}

async function readOk(id: string, waitMs?: number) {
  const run = await readRun(id, waitMs === undefined ? {} : { waitMs });
  assert.ok(run);
  return run;
}

test("a run is stored queued, handed to the runner, and mirrors the job until it succeeds", async () => {
  const { runner } = freshEnvironment();
  const started = await startRun(found(), { files: { "top_module.v": solution }, taskId: 2 });
  assert.equal(started.state, "queued");
  assert.equal(started.position, 0);
  assert.equal(started.kind, "test");
  assert.equal(started.taskId, 2);
  assert.equal(started.courseId, COURSE_ID);
  assert.equal(started.itemId, TASKS_ITEM.id);
  assert.equal(started.itemSlug, TASKS_ITEM.slug);
  assert.equal(started.revision, TASKS_ITEM.revision);
  assert.deepEqual(started.files, { "top_module.v": solution });

  // The job carries the merged files, the checks and the task map; the record carries none of it.
  const request = runner.requests[0] as TestJobRequest;
  assert.equal(request.runner, "iverilog-cocotb@1");
  assert.equal(request.top, "top_module");
  assert.equal(request.solution, "top_module.v");
  assert.deepEqual(Object.keys(request.files), ["defs.vh", "helper.v", "top_module.v"]);
  assert.equal(request.files["top_module.v"], solution);
  assert.deepEqual(request.checks, TASKS_ITEM.checks);
  assert.deepEqual(request.tasks, [
    { id: 1, tests: ["output_is_one_bit"] },
    { id: 2, tests: ["output_is_high", "output_stays_high"] },
  ]);
  assert.equal(request.taskId, 2);
  assert.equal(request.itemKind, "concept");
  assert.ok(!JSON.stringify(started).includes(CHECKS_MARKER));

  assert.equal((await readOk(started.id)).state, "queued");
  runner.run();
  const running = await readOk(started.id);
  assert.equal(running.state, "running");
  assert.equal(running.position, undefined);

  runner.succeed(testResult(passReport([2, 2])));
  const done = await readOk(started.id, 5000);
  assert.equal(done.state, "succeeded");
  assert.equal(done.report?.status, "pass");
  assert.equal(done.log, "simulation log\n");
  assert.equal(done.waveform, "$timescale 1ns $end\n");
  assert.equal(done.durationMs, 42);
  assert.ok(done.finishedAt);
  assert.equal(runner.waits.at(-1), 5000);
  assert.ok(!JSON.stringify(done).includes(CHECKS_MARKER));
  assert.ok(!JSON.stringify(done).includes(IMAGE_ID));

  // A terminal run is served from the store without asking the runner.
  const calls = runner.waits.length;
  runner.forget();
  assert.deepEqual(await readOk(started.id), done);
  assert.equal(runner.waits.length, calls);

  assert.deepEqual(itemProgress(COURSE_ID, TASKS_ITEM).tasks, { "1": "untested", "2": "passed" });
});

test("a read with seen answers from the store when the run already differs, and otherwise asks the runner", async () => {
  const { runner } = freshEnvironment();
  await startRun(found(), { files: { "top_module.v": solution } });
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  assert.equal(run.state, "queued");
  assert.equal(run.position, 1);

  // Without state the runner is asked as before, with no seen.
  await readRun(run.id, { waitMs: 100 });
  assert.equal(runner.seens.at(-1), undefined);
  assert.equal(runner.waits.at(-1), 100);

  // The store holds something other than what the browser saw: answered without asking the runner.
  const calls = runner.waits.length;
  for (const seen of [{ state: "queued", position: 3 }, { state: "running" }, { state: "succeeded" }] as const) {
    const read = await readRun(run.id, { waitMs: 5000, seen });
    assert.equal(read?.state, "queued", JSON.stringify(seen));
    assert.equal(read.position, 1);
  }
  assert.equal(runner.waits.length, calls);

  // The store holds what the browser saw: the runner is asked with it, and its answer is stored.
  runner.set(runner.lastJobId, { state: "queued", position: 0 });
  const moved = await readRun(run.id, { waitMs: 5000, seen: { state: "queued", position: 1 } });
  assert.equal(moved?.state, "queued");
  assert.equal(moved.position, 0);
  assert.deepEqual(runner.seens.at(-1), { state: "queued", position: 1 });
  assert.equal(runner.waits.at(-1), 5000);

  runner.run();
  const running = await readRun(run.id, { waitMs: 5000, seen: { state: "queued", position: 0 } });
  assert.equal(running?.state, "running");
  assert.equal(running.position, undefined);
  // Without a seen position only the state counts.
  runner.set(runner.lastJobId, { state: "running" });
  assert.equal((await readRun(run.id, { waitMs: 5000, seen: { state: "running" } }))?.state, "running");
  assert.deepEqual(runner.seens.at(-1), { state: "running" });

  // A late answer cannot move the stored run back to queued.
  runner.set(runner.lastJobId, { state: "queued", position: 0 });
  const kept = await readRun(run.id, { waitMs: 5000, seen: { state: "running" } });
  assert.equal(kept?.state, "running");
  assert.equal(kept.position, undefined);

  runner.succeed(testResult(passReport([1, 2, 2])));
  const done = await readRun(run.id, { waitMs: 5000, seen: { state: "running" } });
  assert.equal(done?.state, "succeeded");
  assert.equal(done.report?.status, "pass");

  // A terminal run is answered from the store whatever was seen, and is never changed.
  const settled = runner.waits.length;
  runner.fail({ kind: "execution", message: "Too late." });
  for (const seen of [{ state: "running" }, { state: "succeeded" }] as const)
    assert.deepEqual(await readRun(run.id, { waitMs: 5000, seen }), done);
  assert.equal(runner.waits.length, settled);
});

test("a read with seen of a job the runner forgot fails the run with unavailable", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  runner.forget();
  const lost = await readRun(run.id, { waitMs: 5000, seen: { state: "queued", position: 0 } });
  assert.equal(lost?.state, "failed");
  assert.equal(lost.error?.kind, "unavailable");
});

test("a failing report is stored as succeeded with a fail report", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  runner.succeed(
    testResult({
      status: "fail",
      tests: [
        { name: "One bit", status: "pass", test_code: "assert True", task_id: 1 },
        { name: "High", status: "fail", test_code: "assert False", message: "out is 0", task_id: 2 },
        { name: "Stays", status: "pass", test_code: "assert True", task_id: 2 },
      ],
    }),
  );
  const done = await readOk(run.id);
  assert.equal(done.state, "succeeded");
  assert.equal(done.report?.status, "fail");
  const progress = itemProgress(COURSE_ID, TASKS_ITEM);
  assert.deepEqual(progress.tasks, { "1": "passed", "2": "failed" });
  assert.equal(progress.status, "in-progress");
});

test("a failed job keeps its error; a timeout fails the tasks it covered, an execution error none", async () => {
  const { runner } = freshEnvironment();
  const timeout = await startRun(found(), { files: { "top_module.v": solution }, taskId: 1 });
  runner.fail({ kind: "timeout", message: "The simulation ran out of time." });
  const timedOut = await readOk(timeout.id);
  assert.equal(timedOut.state, "failed");
  assert.deepEqual(timedOut.error, { kind: "timeout", message: "The simulation ran out of time." });
  assert.equal(timedOut.report, undefined);
  assert.deepEqual(itemProgress(COURSE_ID, TASKS_ITEM).tasks, { "1": "failed", "2": "untested" });

  const broken = await startRun(found(), { files: { "top_module.v": solution }, taskId: 2 });
  runner.fail({ kind: "execution", message: "The container stopped." });
  assert.equal((await readOk(broken.id)).error?.kind, "execution");
  assert.deepEqual(itemProgress(COURSE_ID, TASKS_ITEM).tasks, { "1": "failed", "2": "untested" });

  const cancelled = await startRun(found(), { files: { "top_module.v": solution } });
  runner.set(runner.lastJobId, { state: "cancelled", finishedAt: new Date().toISOString() });
  const read = await readOk(cancelled.id);
  assert.equal(read.state, "cancelled");
  assert.equal(read.error, undefined);
});

test("a runner that cannot be reached stores the run as failed with unavailable", async () => {
  const { runner } = freshEnvironment();
  runner.unreachable = true;
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  assert.equal(run.state, "failed");
  assert.equal(run.error?.kind, "unavailable");
  assert.ok(run.finishedAt);
  assert.equal(runner.requests.length, 0);
  // It is stored, and it counts as a run of the item.
  assert.deepEqual(await readOk(run.id), run);
  assert.equal(itemProgress(COURSE_ID, TASKS_ITEM).runs, 1);
});

test("a job the runner forgot, or a runner that went away mid-run, fails the run with unavailable", async () => {
  const { runner } = freshEnvironment();
  const forgotten = await startRun(found(), { files: { "top_module.v": solution } });
  runner.forget();
  const lost = await readOk(forgotten.id);
  assert.equal(lost.state, "failed");
  assert.equal(lost.error?.kind, "unavailable");
  assert.match(lost.error?.message ?? "", /no longer has this job/);

  const stranded = await startRun(found(), { files: { "top_module.v": solution } });
  runner.unreachable = true;
  const gone = await readOk(stranded.id);
  assert.equal(gone.state, "failed");
  assert.equal(gone.error?.kind, "unavailable");
  // Once failed it stays failed, even when the runner comes back.
  runner.unreachable = false;
  assert.equal((await readOk(stranded.id)).state, "failed");
});

test("a run stored without a job id (a submission lost in a restart) fails on read", async () => {
  freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  database().prepare("UPDATE runs SET job_id = NULL, state = 'queued' WHERE id = ?").run(run.id);
  const read = await readOk(run.id);
  assert.equal(read.state, "failed");
  assert.equal(read.error?.kind, "unavailable");
});

test("concurrent reads of a finishing run store its result and its completion once", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult(passReport()));
  runner.getDelayMs = 20;
  const reads = await Promise.all([readRun(run.id), readRun(run.id), readRun(run.id)]);
  assert.equal(reads[0]?.state, "succeeded");
  assert.deepEqual(reads[1], reads[0]);
  assert.deepEqual(reads[2], reads[0]);
  const db = database();
  assert.deepEqual(db.prepare("SELECT COUNT(*) AS n FROM completions").get(), { n: 1 });
  assert.deepEqual(db.prepare("SELECT COUNT(*) AS n FROM runs").get(), { n: 1 });
  const progress = itemProgress(COURSE_ID, TASKS_ITEM);
  assert.equal(progress.status, "completed");
  assert.equal(progress.completedAt, reads[0]?.finishedAt);
});

test("an earlier read that returns late cannot move a run back from running to queued", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  runner.getDelayMs = 30;
  const slow = readRun(run.id); // sees queued
  await new Promise((resolve) => setTimeout(resolve, 5));
  runner.getDelayMs = 0;
  runner.run();
  // The runner answers this read with the newer state before the slow read finishes.
  assert.equal((await readOk(run.id)).state, "running");
  assert.equal((await slow)?.state, "running");
});

test("a full queue rejects the start and stores nothing", async () => {
  const { runner } = freshEnvironment();
  runner.busy = true;
  await assert.rejects(startRun(found(), { files: { "top_module.v": solution } }), { name: "RunnerRequestError", status: 429 });
  assert.equal(runHistory(COURSE_ID, TASKS_ITEM.id, null).total, 0);
});

test("task selection is validated against the item", async () => {
  freshEnvironment();
  const files = { "top_module.v": solution };
  const rejects = (promise: Promise<unknown>, pattern: RegExp) =>
    assert.rejects(promise, (error: unknown) => error instanceof HttpError && error.status === 400 && pattern.test(error.message));
  await rejects(startRun(found(), { files, taskId: 1, submit: true }), /leave out taskId/);
  await rejects(startRun(found(), { files, taskId: 3 }), /no task 3/);
  await rejects(startRun(found(PLAIN_ITEM.slug), { files, taskId: 1 }), /no task 1/);
  await rejects(startRun(found(), { files: { "defs.vh": "x", "top_module.v": solution } }), /defs\.vh/);
  assert.equal(runHistory(COURSE_ID, TASKS_ITEM.id, null).total, 0);
});

test("an item without tasks sends no task map and records no task statuses", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(PLAIN_ITEM.slug), { files: { "top_module.v": solution }, submit: true });
  assert.equal((runner.requests[0] as TestJobRequest).tasks, undefined);
  runner.succeed(testResult({ status: "pass", tests: [{ name: "Wire", status: "pass", test_code: "assert True" }] }));
  await readOk(run.id);
  const progress = itemProgress(COURSE_ID, PLAIN_ITEM);
  assert.deepEqual(progress.tasks, {});
  assert.equal(progress.status, "completed");
});

test("the stored log keeps its tail and the waveform its head, within the bounds", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution } });
  const log = Array.from({ length: 4000 }, (_, line) => `line ${line} ${"x".repeat(20)}`).join("\n") + "\nlast line\n";
  const waveform = Array.from({ length: 80000 }, (_, step) => `#${step}\n1!`).join("\n") + "\n";
  assert.ok(Buffer.byteLength(log) > LOG_BYTES && Buffer.byteLength(waveform) > WAVEFORM_BYTES);
  runner.succeed(testResult(passReport(), { log, waveform }));
  const done = await readOk(run.id);
  assert.ok(Buffer.byteLength(done.log ?? "") <= LOG_BYTES);
  assert.ok(done.log?.endsWith("last line\n"));
  assert.ok(done.log?.startsWith("line "));
  assert.ok(Buffer.byteLength(done.waveform ?? "") <= WAVEFORM_BYTES);
  assert.ok(done.waveform?.startsWith("#0\n1!"));
  assert.ok(done.waveform?.endsWith("\n"));
});

test("history pages newest first with a cursor that stays stable as runs are added", async () => {
  const { runner } = freshEnvironment();
  const ids: string[] = [];
  for (let attempt = 0; attempt < 23; attempt++) {
    const run = await startRun(found(), { files: { "top_module.v": `${solution}// ${attempt}\n` } });
    if (attempt % 2 === 0) runner.succeed(testResult(passReport()));
    ids.push(run.id);
  }
  await startRun(found(PLAIN_ITEM.slug), { files: { "top_module.v": solution } });
  const first = runHistory(COURSE_ID, TASKS_ITEM.id, null);
  assert.equal(first.total, 23);
  assert.equal(first.runs.length, HISTORY_PAGE_SIZE);
  assert.deepEqual(
    first.runs.map((run) => run.id),
    ids.slice(3).reverse(),
  );
  assert.ok(first.nextCursor);
  for (const run of first.runs) {
    assert.equal("files" in run, false);
    assert.equal("log" in run, false);
    assert.equal("waveform" in run, false);
  }
  await startRun(found(), { files: { "top_module.v": solution } });
  const second = runHistory(COURSE_ID, TASKS_ITEM.id, first.nextCursor);
  assert.equal(second.total, 24);
  assert.deepEqual(
    second.runs.map((run) => run.id),
    ids.slice(0, 3).reverse(),
  );
  assert.equal(second.nextCursor, null);
  assert.equal(runHistory(COURSE_ID, PLAIN_ITEM.id, null).total, 1);
  assert.throws(() => runHistory(COURSE_ID, TASKS_ITEM.id, "../x"), { status: 400 });
  assert.throws(() => runHistory(COURSE_ID, TASKS_ITEM.id, "0"), { status: 400 });
});

test("old finished runs are pruned beyond the bound, except those progress depends on", async () => {
  const { runner } = freshEnvironment();
  // The oldest run covers task 1; no later run does, so progress depends on it.
  const task1 = await startRun(found(), { files: { "top_module.v": solution }, taskId: 1 });
  runner.succeed(testResult(passReport([1])));
  await readOk(task1.id);
  const unfinished = await startRun(found(), { files: { "top_module.v": solution }, taskId: 2 });
  const prunable: string[] = [];
  for (let attempt = 0; attempt < RUNS_KEPT_PER_ITEM + 5; attempt++) {
    const run = await startRun(found(), { files: { "top_module.v": solution }, taskId: 2 });
    runner.succeed(testResult(passReport([2, 2])));
    await readOk(run.id);
    prunable.push(run.id);
  }
  const history = runHistory(COURSE_ID, TASKS_ITEM.id, null);
  // The newest 100 runs, the run task 1 depends on, and the run still in flight.
  assert.equal(history.total, RUNS_KEPT_PER_ITEM + 2);
  const kept = new Set(
    (database().prepare("SELECT id FROM runs").all() as { id: string }[]).map((row) => row.id),
  );
  assert.ok(kept.has(task1.id));
  assert.ok(kept.has(unfinished.id));
  assert.equal(prunable.filter((id) => !kept.has(id)).length, 5);
  assert.deepEqual(itemProgress(COURSE_ID, TASKS_ITEM).tasks, { "1": "passed", "2": "passed" });
});
