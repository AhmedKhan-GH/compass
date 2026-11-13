import assert from "node:assert/strict";
import { test } from "node:test";
import { findCourse, findIndexedItem } from "../../src/server/content.ts";
import {
  courseProgress,
  deriveItemProgress,
  isPassingSubmission,
  itemProgress,
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
  assert.deepEqual(taskVerdicts([], undefined, { report: { status: "pass", tests: [pass()] } }), {});
  // One task, untagged tests.
  assert.deepEqual(taskVerdicts([{ id: 1, tests: ["a"] }], undefined, { report: { status: "pass", tests: [pass()] } }), {
    "1": "passed",
  });
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
      [PLAIN_ITEM.slug]: { status: "completed", tasks: {}, completedAt: finished?.finishedAt, runs: 1 },
    },
  });
  // A run of the same item id in another course is not this course's progress.
  const bare = findCourse("test/bare");
  assert.ok(bare);
  assert.deepEqual(courseProgress(bare).items, {});
});
