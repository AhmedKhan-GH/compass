import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { JobError, RunKind, RunReport } from "@compass/schema";
import { findCourse, findIndexedItem } from "../../src/server/content.ts";
import { database } from "../../src/server/db.ts";
import {
  courseProgress,
  deriveItemProgress,
  isPassingSubmission,
  itemProgress,
  progressDependencies,
  resetItem,
  taskVerdicts,
  type ProgressRun,
} from "../../src/server/progress.ts";
import { readRun, runHistory, startRun } from "../../src/server/runs.ts";
import {
  COURSE_ID,
  PLAIN_ITEM,
  TASKS_ITEM,
  fixtureIndex,
  freshEnvironment,
  passReport,
  testResult,
  writeIndex,
} from "./fixture.ts";

const solution = "module top_module(output out); assign out = 1'b1; endmodule\n";
const tasks = [
  { id: 1, tests: ["a"] },
  { id: 2, tests: ["b", "c"] },
];

function found(slug = TASKS_ITEM.slug) {
  const item = findIndexedItem(COURSE_ID, slug);
  assert.ok(item);
  return item;
}

test("task verdicts: scoped runs cover their task, full runs the tasks they report, errors every selected task", () => {
  const pass = (task_id?: number) => ({ name: "t", status: "pass" as const, test_code: "x", ...(task_id ? { task_id } : {}) });
  const fail = (task_id: number) => ({ name: "t", status: "fail" as const, test_code: "x", task_id });
  assert.deepEqual(taskVerdicts(tasks, undefined, { report: { status: "pass", tests: [pass(1), pass(2), pass(2)] } }), {
    "1": "passed",
    "2": "passed",
  });
  // Task 2 needs both of its tests.
  assert.deepEqual(taskVerdicts(tasks, undefined, { report: { status: "fail", tests: [pass(1), pass(2)] } }), {
    "1": "passed",
    "2": "failed",
  });
  assert.deepEqual(taskVerdicts(tasks, 2, { report: { status: "fail", tests: [pass(2), fail(2)] } }), { "2": "failed" });
  // A full run that reports nothing for a task does not cover it.
  assert.deepEqual(taskVerdicts(tasks, undefined, { report: { status: "pass", tests: [pass(1)] } }), { "1": "passed" });
  assert.deepEqual(taskVerdicts(tasks, undefined, { report: { status: "error", message: "syntax error" } }), {
    "1": "failed",
    "2": "failed",
  });
  assert.deepEqual(taskVerdicts(tasks, 1, { error: { kind: "timeout", message: "slow" } }), { "1": "failed" });
  assert.deepEqual(taskVerdicts(tasks, undefined, { error: { kind: "unavailable", message: "down" } }), {});
  // One task, untagged tests.
  assert.deepEqual(taskVerdicts([{ id: 1, tests: ["a"] }], undefined, { report: { status: "pass", tests: [pass()] } }), {
    "1": "passed",
  });
});

test("a whole run, with no task map, judges the implicit task 1 by the whole report", () => {
  const pass = { name: "t", status: "pass" as const, test_code: "x" };
  const fail = { name: "u", status: "fail" as const, test_code: "y" };
  for (const taskId of [undefined, 1]) {
    assert.deepEqual(taskVerdicts([], taskId, { report: { status: "pass", tests: [pass, pass] } }), { "1": "passed" });
    assert.deepEqual(taskVerdicts([], taskId, { report: { status: "fail", tests: [pass, fail] } }), { "1": "failed" });
    assert.deepEqual(taskVerdicts([], taskId, { report: { status: "error", message: "syntax error" } }), { "1": "failed" });
    assert.deepEqual(taskVerdicts([], taskId, { error: { kind: "timeout", message: "slow" } }), { "1": "failed" });
    // Failures outside the learner's code and cancelled runs change nothing.
    assert.deepEqual(taskVerdicts([], taskId, { error: { kind: "unavailable", message: "down" } }), {});
    assert.deepEqual(taskVerdicts([], taskId, { error: { kind: "execution", message: "broke" } }), {});
    assert.deepEqual(taskVerdicts([], taskId, {}), {});
  }
  // A report with no tests covers nothing, unless the run was of the task.
  assert.deepEqual(taskVerdicts([], undefined, { report: { status: "pass", tests: [] } }), {});
  assert.deepEqual(taskVerdicts([], 1, { report: { status: "pass", tests: [] } }), { "1": "failed" });
});

test("only a passing submission over every test completes an item", () => {
  const tests = [{ name: "t", status: "pass" as const, test_code: "x" }];
  const report = { status: "pass" as const, tests };
  assert.equal(isPassingSubmission("submission", undefined, report), true);
  assert.equal(isPassingSubmission("test", undefined, report), false);
  assert.equal(isPassingSubmission("submission", 1, report), false);
  assert.equal(isPassingSubmission("submission", undefined, { status: "fail", tests }), false);
  assert.equal(isPassingSubmission("submission", undefined, { status: "error", message: "x" }), false);
});

test("derived progress uses the newest covering run of the current revision since the reset", () => {
  const item = { revision: "r2", tasks: TASKS_ITEM.tasks };
  const runs: ProgressRun[] = [
    { seq: 9, revision: "r2", verdicts: { "2": "failed" } },
    { seq: 8, revision: "r1", verdicts: { "1": "failed" } },
    { seq: 7, revision: "r2", verdicts: { "1": "passed", "2": "passed" } },
    { seq: 6, revision: "r2", verdicts: undefined },
    { seq: 3, revision: "r2", verdicts: { "1": "failed" } },
  ];
  assert.deepEqual(deriveItemProgress(item, runs, 0, undefined), {
    status: "in-progress",
    tasks: { "1": "passed", "2": "failed" },
    runs: 4,
  });
  assert.deepEqual(deriveItemProgress(item, runs, 7, undefined), {
    status: "in-progress",
    tasks: { "1": "untested", "2": "failed" },
    runs: 1,
  });
  assert.deepEqual(deriveItemProgress(item, runs, 9, undefined), {
    status: "not-started",
    tasks: { "1": "untested", "2": "untested" },
    runs: 0,
  });
  assert.deepEqual(deriveItemProgress(item, [], 0, "2026-11-13T00:00:00.000Z"), {
    status: "completed",
    tasks: { "1": "untested", "2": "untested" },
    completedAt: "2026-11-13T00:00:00.000Z",
    runs: 0,
  });
});

test("a passing test run does not complete the item; a passing submission does, and later failures keep it", async () => {
  const { runner } = freshEnvironment();
  const test1 = await startRun(found(), { files: { "top_module.v": solution } });
  runner.succeed(testResult(passReport()));
  await readRun(test1.id);
  assert.equal(itemProgress(COURSE_ID, TASKS_ITEM).status, "in-progress");

  const submission = await startRun(found(), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult(passReport()));
  const passed = await readRun(submission.id);
  const failing = await startRun(found(), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult({ status: "error", message: "syntax error" }));
  await readRun(failing.id);

  const progress = itemProgress(COURSE_ID, TASKS_ITEM);
  assert.equal(progress.status, "completed");
  assert.equal(progress.completedAt, passed?.finishedAt);
  assert.deepEqual(progress.tasks, { "1": "failed", "2": "failed" });
  assert.equal(progress.runs, 3);
});

test("a new revision of the item starts its progress over", async () => {
  const { runner } = freshEnvironment();
  const run = await startRun(found(), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult(passReport()));
  await readRun(run.id);
  assert.equal(itemProgress(COURSE_ID, TASKS_ITEM).status, "completed");
  const revised = { ...TASKS_ITEM, revision: "d".repeat(64) };
  writeIndex(fixtureIndex([revised, PLAIN_ITEM]));
  assert.deepEqual(itemProgress(COURSE_ID, revised), {
    status: "not-started",
    tasks: { "1": "untested", "2": "untested" },
    runs: 0,
  });
  assert.equal(runHistory(COURSE_ID, TASKS_ITEM.id, null).total, 1);
});

test("reset starts the item over, keeps its history, and ignores runs started before it", async () => {
  const { runner } = freshEnvironment();
  const done = await startRun(found(), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult(passReport()));
  await readRun(done.id);
  const other = await startRun(found(PLAIN_ITEM.slug), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult({ status: "pass", tests: [{ name: "w", status: "pass", test_code: "x" }] }));
  await readRun(other.id);
  // In flight across the reset.
  const inFlight = await startRun(found(), { files: { "top_module.v": solution }, submit: true });

  assert.deepEqual(resetItem(COURSE_ID, TASKS_ITEM), {
    status: "not-started",
    tasks: { "1": "untested", "2": "untested" },
    runs: 0,
  });
  runner.succeed(testResult(passReport()));
  assert.equal((await readRun(inFlight.id))?.state, "succeeded");
  assert.equal(itemProgress(COURSE_ID, TASKS_ITEM).status, "not-started");
  assert.equal(runHistory(COURSE_ID, TASKS_ITEM.id, null).total, 2);
  // Only the chosen item was reset.
  assert.equal(itemProgress(COURSE_ID, PLAIN_ITEM).status, "completed");

  const again = await startRun(found(), { files: { "top_module.v": solution }, taskId: 1 });
  runner.succeed(testResult(passReport([1])));
  await readRun(again.id);
  assert.deepEqual(itemProgress(COURSE_ID, TASKS_ITEM), {
    status: "in-progress",
    tasks: { "1": "passed", "2": "untested" },
    runs: 1,
  });
});

test("course progress lists items with runs by slug and leaves out the rest", async () => {
  const { runner } = freshEnvironment();
  const course = findCourse(COURSE_ID);
  assert.ok(course);
  assert.deepEqual(courseProgress(course), { courseId: COURSE_ID, items: {} });
  const run = await startRun(found(PLAIN_ITEM.slug), { files: { "top_module.v": solution }, submit: true });
  runner.succeed(testResult({ status: "pass", tests: [{ name: "w", status: "pass", test_code: "x" }] }));
  const finished = await readRun(run.id);
  assert.deepEqual(courseProgress(course), {
    courseId: COURSE_ID,
    items: {
      [PLAIN_ITEM.slug]: { status: "completed", tasks: { "1": "passed" }, completedAt: finished?.finishedAt, runs: 1 },
    },
  });
  // A run of the same item id in another course is not this course's progress.
  const bare = findCourse("test/bare");
  assert.ok(bare);
  assert.deepEqual(courseProgress(bare).items, {});
});

/**
 * Stores a finished run of the item without tasks exactly as the code before implicit tasks did: no task map, no
 * task id (task 1 did not exist), empty verdicts, and a completion for a passing submission.
 */
function insertLegacyRun(kind: RunKind, outcome: { report?: RunReport; error?: JobError; cancelled?: boolean }): string {
  const db = database();
  const id = randomUUID();
  const finishedAt = new Date().toISOString();
  const state = outcome.cancelled ? "cancelled" : outcome.report ? "succeeded" : "failed";
  db.prepare(
    `INSERT INTO runs (id, course_id, item_id, item_slug, revision, kind, task_id, tasks_json, files_json, job_id, state,
       created_at, finished_at, duration_ms, report_json, log, waveform, error_json, image_id, task_status_json)
     VALUES (?, ?, ?, ?, ?, ?, NULL, '[]', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, '{}')`,
  ).run(
    id,
    COURSE_ID,
    PLAIN_ITEM.id,
    PLAIN_ITEM.slug,
    PLAIN_ITEM.revision,
    kind,
    JSON.stringify({ "top_module.v": solution }),
    `job-${id}`,
    state,
    finishedAt,
    finishedAt,
    outcome.report ? 42 : null,
    outcome.report ? JSON.stringify(outcome.report) : null,
    outcome.report ? "log\n" : null,
    outcome.error ? JSON.stringify(outcome.error) : null,
  );
  if (isPassingSubmission(kind, undefined, outcome.report))
    db.prepare(
      `INSERT INTO completions (course_id, item_id, revision, run_id, completed_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT DO NOTHING`,
    ).run(COURSE_ID, PLAIN_ITEM.id, PLAIN_ITEM.revision, id, finishedAt);
  return id;
}

const wirePass: RunReport = { status: "pass", tests: [{ name: "Wire", status: "pass", test_code: "assert b == a" }] };
const wireFail: RunReport = {
  status: "fail",
  tests: [{ name: "Wire", status: "fail", test_code: "assert b == a", message: "b is 0" }],
};

test("runs stored before implicit tasks still give task 1 its verdict, and a completed item stays completed", () => {
  freshEnvironment();
  const db = database();
  const submission = insertLegacyRun("submission", { report: wirePass });
  const completedAt = (db.prepare("SELECT completed_at FROM completions").get() as { completed_at: string }).completed_at;
  assert.deepEqual(itemProgress(COURSE_ID, PLAIN_ITEM), {
    status: "completed",
    tasks: { "1": "passed" },
    completedAt,
    runs: 1,
  });
  // The store is read, never rewritten.
  assert.deepEqual(db.prepare("SELECT task_status_json FROM runs WHERE id = ?").get(submission), { task_status_json: "{}" });

  // Runs that failed outside the learner's code, or were cancelled, change nothing.
  insertLegacyRun("test", { error: { kind: "unavailable", message: "down" } });
  insertLegacyRun("test", { cancelled: true });
  assert.deepEqual(itemProgress(COURSE_ID, PLAIN_ITEM).tasks, { "1": "passed" });

  // The latest judged run decides: a failing run fails the task, and the item stays completed.
  const failing = insertLegacyRun("test", { report: wireFail });
  insertLegacyRun("test", { error: { kind: "execution", message: "broke" } });
  const course = findCourse(COURSE_ID);
  assert.ok(course);
  assert.deepEqual(courseProgress(course).items[PLAIN_ITEM.slug], {
    status: "completed",
    tasks: { "1": "failed" },
    completedAt,
    runs: 5,
  });
  // Pruning keeps the run that decides task 1 and the run that completed the item.
  assert.deepEqual(
    progressDependencies(db, COURSE_ID, PLAIN_ITEM.id, PLAIN_ITEM.revision),
    new Set([failing, submission]),
  );

  // A compile error and a timeout fail the task as well.
  insertLegacyRun("test", { report: wirePass });
  assert.deepEqual(itemProgress(COURSE_ID, PLAIN_ITEM).tasks, { "1": "passed" });
  insertLegacyRun("test", { report: { status: "error", message: "syntax error" } });
  assert.deepEqual(itemProgress(COURSE_ID, PLAIN_ITEM).tasks, { "1": "failed" });
  insertLegacyRun("test", { report: wirePass });
  const timedOut = insertLegacyRun("test", { error: { kind: "timeout", message: "slow" } });
  assert.deepEqual(itemProgress(COURSE_ID, PLAIN_ITEM).tasks, { "1": "failed" });
  assert.deepEqual(
    progressDependencies(db, COURSE_ID, PLAIN_ITEM.id, PLAIN_ITEM.revision),
    new Set([timedOut, submission]),
  );
});

test("a reset clears task 1 of an item without tasks, old runs and new alike", async () => {
  const { runner } = freshEnvironment();
  insertLegacyRun("submission", { report: wirePass });
  assert.equal(itemProgress(COURSE_ID, PLAIN_ITEM).status, "completed");
  assert.deepEqual(resetItem(COURSE_ID, PLAIN_ITEM), { status: "not-started", tasks: { "1": "untested" }, runs: 0 });
  assert.deepEqual(progressDependencies(database(), COURSE_ID, PLAIN_ITEM.id, PLAIN_ITEM.revision), new Set());

  // A run after the reset counts, with its verdict stored by the new code.
  const run = await startRun(found(PLAIN_ITEM.slug), { files: { "top_module.v": solution }, taskId: 1 });
  runner.succeed(testResult(wireFail));
  await readRun(run.id);
  assert.deepEqual(itemProgress(COURSE_ID, PLAIN_ITEM), { status: "in-progress", tasks: { "1": "failed" }, runs: 1 });
  assert.deepEqual(database().prepare("SELECT task_status_json FROM runs WHERE id = ?").get(run.id), {
    task_status_json: '{"1":"failed"}',
  });
  assert.deepEqual(resetItem(COURSE_ID, PLAIN_ITEM), { status: "not-started", tasks: { "1": "untested" }, runs: 0 });
});
