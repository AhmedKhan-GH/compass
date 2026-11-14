import assert from "node:assert/strict";
import test from "node:test";
import type { RunRecord, TestResult } from "@compass/schema";
import {
  firstLine,
  formatDuration,
  lessonState,
  runOutcome,
  runResult,
  runScope,
  runStatus,
  taskOfTest,
  taskStatusesFromRun,
  testCounts,
  testsByTask,
} from "../../src/lib/runs.ts";

const base: RunRecord = {
  id: "r",
  courseId: "a/b",
  itemId: "i",
  itemSlug: "s",
  revision: "0".repeat(64),
  kind: "test",
  state: "succeeded",
  createdAt: "2026-11-13T10:00:00Z",
  files: {},
};
const pass: TestResult = { name: "one", status: "pass", test_code: "x", task_id: 1 };
const fail: TestResult = { name: "two", status: "fail", test_code: "y", message: "Expected 1", task_id: 2 };
const error: TestResult = { name: "three", status: "error", test_code: "z", message: "Boom" };

test("a run's status mark follows its state and report", () => {
  assert.equal(runStatus({ ...base, report: { status: "pass", tests: [pass] } }), "passed");
  assert.equal(runStatus({ ...base, report: { status: "fail", tests: [pass, fail] } }), "failed");
  assert.equal(runStatus({ ...base, report: { status: "error", message: "syntax error" } }), "error");
  assert.equal(
    runStatus({ ...base, state: "failed", error: { kind: "unavailable", message: "Docker" } }),
    "unavailable",
  );
  assert.equal(runStatus({ ...base, state: "failed", error: { kind: "timeout", message: "late" } }), "error");
  assert.equal(runStatus({ ...base, state: "queued" }), "queued");
});

test("counts and the short result", () => {
  const report = { status: "fail" as const, tests: [pass, fail, error] };
  assert.deepEqual(testCounts({ report }), { passed: 1, failed: 1, errors: 1, total: 3 });
  assert.equal(runResult({ ...base, report }), "1 of 3 passed");
  assert.equal(
    runResult({ ...base, state: "failed", error: { kind: "unavailable", message: "" } }),
    "Runner unavailable",
  );
  assert.equal(testCounts({ report: { status: "error", message: "x" } }), undefined);
});

test("the scope of a run", () => {
  assert.equal(runScope({ kind: "submission" }), "Submission");
  assert.equal(runScope({ kind: "test", taskId: 2 }), "Task 2");
  assert.equal(runScope({ kind: "test" }), "All tasks");
});

test("tests are grouped by task, in task order, with unmapped tests last", () => {
  const tasks = [
    { id: 1, title: "First", tests: ["one"] },
    { id: 2, title: "Second", tests: ["two"] },
    { id: 3, title: "Third", tests: ["four"] },
  ];
  const groups = testsByTask([fail, error, pass], tasks);
  assert.deepEqual(
    groups.map((group) => [group.taskId, group.tests.map((test) => test.name)]),
    [
      [1, ["one"]],
      [2, ["two"]],
      [undefined, ["three"]],
    ],
  );
});

test("durations and first lines", () => {
  assert.equal(formatDuration(812), "0.8 s");
  assert.equal(formatDuration(12_400), "12 s");
  assert.equal(formatDuration(64_000), "1 min 4 s");
  assert.equal(formatDuration(undefined), "");
  assert.equal(firstLine("\n  top.v:3: syntax error\nmore"), "top.v:3: syntax error");
});

test("a finished run in words: all passed, some failed with the first failure, an error, an unavailable runner", () => {
  const tasks = [
    { id: 1, title: "First" },
    { id: 2, title: "Second" },
  ];
  assert.deepEqual(
    runOutcome(
      { ...base, report: { status: "pass", tests: [pass, { ...pass, name: "b" }, { ...pass, name: "c" }] } },
      tasks,
    ),
    {
      tone: "passed",
      status: "passed",
      title: "All 3 tests passed",
    },
  );
  assert.equal(runOutcome({ ...base, report: { status: "pass", tests: [pass] } }).title, "The test passed");
  assert.deepEqual(runOutcome({ ...base, report: { status: "fail", tests: [pass, fail, error] } }, tasks), {
    tone: "failed",
    status: "failed",
    title: "2 of 3 failed",
    detail: "Task 2 · two · Expected 1",
  });
  assert.deepEqual(runOutcome({ ...base, report: { status: "error", message: "\ntop.v:3: syntax error\nmore" } }), {
    tone: "failed",
    status: "error",
    title: "Error",
    detail: "top.v:3: syntax error",
  });
  assert.deepEqual(
    runOutcome({ ...base, state: "failed", error: { kind: "unavailable", message: "Docker is down" } }),
    {
      tone: "warning",
      status: "unavailable",
      title: "Runner unavailable",
      detail: "Docker is down",
    },
  );
  assert.equal(runOutcome({ ...base, state: "running" }).tone, "running");
});

test("tasks a run did not cover are kept when asked", () => {
  const tasks = [
    { id: 1, title: "First", tests: ["one"] },
    { id: 2, title: "Second", tests: ["two"] },
  ];
  const groups = testsByTask([pass], tasks, { includeEmpty: true });
  assert.deepEqual(
    groups.map((group) => [group.taskId, group.tests.length]),
    [
      [1, 1],
      [2, 0],
    ],
  );
});

test("the lesson's state: running, completed, failed by the latest run, in progress, not started", () => {
  const failing = { ...base, report: { status: "fail" as const, tests: [pass, fail] } };
  const passing = { ...base, report: { status: "pass" as const, tests: [pass] } };
  assert.equal(
    lessonState({ running: true, progress: { status: "completed" }, latestRun: failing, tasks: {} }).word,
    "Running",
  );
  assert.equal(
    lessonState({ running: false, progress: { status: "completed" }, latestRun: failing, tasks: {} }).word,
    "Completed",
  );
  assert.deepEqual(
    lessonState({ running: false, progress: { status: "in-progress" }, latestRun: failing, tasks: { "1": "passed" } }),
    {
      tone: "failed",
      status: "failed",
      word: "Failed",
    },
  );
  assert.equal(
    lessonState({ running: false, progress: { status: "in-progress" }, latestRun: passing, tasks: { "1": "passed" } })
      .tone,
    "information",
  );
  assert.equal(
    lessonState({
      running: false,
      progress: undefined,
      latestRun: { ...base, state: "failed", error: { kind: "unavailable", message: "" } },
      tasks: {},
    }).word,
    "Not started",
  );
  assert.equal(
    lessonState({ running: false, progress: { status: "not-started" }, latestRun: undefined, tasks: {} }).tone,
    "neutral",
  );
});

// An item without [[task]] has one implicit task: id 1, titled after the item, covering every test. Its results name
// no task.
const implicitTasks = [{ id: 1, title: "Bird Feeder Camera", tests: [], implicit: true as const }];
const whole = (name: string, status: TestResult["status"], message?: string): TestResult =>
  message === undefined ? { name, status, test_code: "t" } : { name, status, test_code: "t", message };

test("each task takes the verdict of its own tests; a compile error fails every task the run covered", () => {
  const tasks = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.deepEqual(taskStatusesFromRun({ ...base, report: { status: "fail", tests: [pass, fail] } }, tasks), {
    "1": "passed",
    "2": "failed",
  });
  assert.deepEqual(
    taskStatusesFromRun({ ...base, taskId: 2, report: { status: "error", message: "syntax error" } }, tasks),
    { "2": "failed" },
  );
  assert.deepEqual(taskStatusesFromRun({ ...base, state: "running" }, tasks), {});
});

test("an implicit task takes the verdict of the whole run", () => {
  const passing = { status: "pass" as const, tests: [whole("a", "pass"), whole("b", "pass")] };
  const failing = { status: "fail" as const, tests: [whole("a", "pass"), whole("b", "fail", "Expected 1")] };
  const submission: RunRecord = { ...base, kind: "submission", report: failing };
  const unavailable: RunRecord = { ...base, state: "failed", error: { kind: "unavailable", message: "" } };
  // Run tests (no task) and Run task 1 both cover it.
  assert.deepEqual(taskStatusesFromRun({ ...base, report: passing }, implicitTasks), { "1": "passed" });
  assert.deepEqual(taskStatusesFromRun({ ...base, taskId: 1, report: passing }, implicitTasks), { "1": "passed" });
  assert.deepEqual(taskStatusesFromRun({ ...base, taskId: 1, report: failing }, implicitTasks), { "1": "failed" });
  assert.deepEqual(taskStatusesFromRun(submission, implicitTasks), {
    "1": "failed",
  });
  assert.deepEqual(
    taskStatusesFromRun({ ...base, report: { status: "error", message: "syntax error" } }, implicitTasks),
    { "1": "failed" },
  );
  assert.deepEqual(taskStatusesFromRun(unavailable, implicitTasks), {});
});

test("results that name no task belong to the implicit task, in one group with the item's title", () => {
  const tests = [whole("a", "pass"), whole("b", "fail", "Expected 1"), whole("c", "error", "Boom")];
  assert.equal(taskOfTest(whole("a", "pass"), implicitTasks)?.id, 1);
  assert.equal(taskOfTest(whole("a", "pass"), [{ id: 1 }, { id: 2 }]), undefined);
  assert.deepEqual(
    testsByTask(tests, implicitTasks, { includeEmpty: true }).map((group) => [
      group.taskId,
      group.title,
      group.tests.map((test) => test.name),
    ]),
    [[1, "Bird Feeder Camera", ["a", "b", "c"]]],
  );
  assert.deepEqual(runOutcome({ ...base, report: { status: "fail", tests } }, implicitTasks), {
    tone: "failed",
    status: "failed",
    title: "2 of 3 failed",
    detail: "Task 1 · b · Expected 1",
  });
});
