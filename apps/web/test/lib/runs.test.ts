import assert from "node:assert/strict";
import test from "node:test";
import type { RunRecord, TestResult } from "@compass/schema";
import {
  firstLine,
  formatDuration,
  runResult,
  runScope,
  runStatus,
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
