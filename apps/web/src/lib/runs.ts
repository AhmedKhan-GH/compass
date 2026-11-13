/**
 * What a run means for the interface: its status mark, its counts, its tests by task. Pure functions over the
 * records of packages/schema.
 */
import type { IndexedTask, ItemProgress, RunRecord, RunSummary, TaskStatus, TestResult } from "@compass/schema";
import type { Status } from "@compass/ui";

type RunLike = Pick<RunRecord, "state" | "report" | "error" | "kind" | "taskId">;

/** The status mark of a run. */
export function runStatus(run: RunLike): Status {
  switch (run.state) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "cancelled":
      return "cancelled";
    case "failed":
      return run.error?.kind === "unavailable" ? "unavailable" : "error";
    case "succeeded":
      if (!run.report) return "error";
      return run.report.status === "pass" ? "passed" : run.report.status === "fail" ? "failed" : "error";
  }
}

export type TestCounts = { passed: number; failed: number; errors: number; total: number };

export function testCounts(run: Pick<RunRecord, "report">): TestCounts | undefined {
  const report = run.report;
  if (!report || report.status === "error") return undefined;
  const counts = { passed: 0, failed: 0, errors: 0, total: report.tests.length };
  for (const test of report.tests) {
    if (test.status === "pass") counts.passed += 1;
    else if (test.status === "fail") counts.failed += 1;
    else counts.errors += 1;
  }
  return counts;
}

/** "Submission", "Task 2" or "All tasks". */
export function runScope(run: Pick<RunRecord, "kind" | "taskId">): string {
  if (run.kind === "submission") return "Submission";
  return run.taskId === undefined ? "All tasks" : `Task ${run.taskId}`;
}

/** The short result of a run: "2 of 3 passed", "Compile error", "Runner unavailable". */
export function runResult(run: RunLike): string {
  switch (run.state) {
    case "queued":
      return "Queued";
    case "running":
      return "Running";
    case "cancelled":
      return "Cancelled";
    case "failed":
      return failureTitle(run.error?.kind);
    case "succeeded": {
      const report = run.report;
      if (!report) return "No report";
      if (report.status === "error") return "Error";
      const counts = testCounts({ report });
      return counts ? `${counts.passed} of ${counts.total} passed` : "No tests";
    }
  }
}

export function failureTitle(kind: string | undefined): string {
  switch (kind) {
    case "unavailable":
      return "Runner unavailable";
    case "timeout":
      return "Time limit";
    case "execution":
      return "Runner failure";
    case "invalid-result":
      return "Invalid result";
    case "design":
      return "Design error";
    default:
      return "Failed";
  }
}

/** The tests of a report grouped by task, in task order, with tests that name no task at the end. */
export function testsByTask(
  tests: readonly TestResult[],
  tasks: readonly Pick<IndexedTask, "id" | "title" | "tests">[],
): { taskId: number | undefined; title: string | undefined; tests: TestResult[] }[] {
  const groups = tasks.map((task) => ({
    taskId: task.id as number | undefined,
    title: task.title as string | undefined,
    tests: [] as TestResult[],
  }));
  const rest: TestResult[] = [];
  for (const test of tests) {
    const group = groups.find((candidate) => candidate.taskId !== undefined && candidate.taskId === test.task_id);
    if (group) group.tests.push(test);
    else rest.push(test);
  }
  const result = groups.filter((group) => group.tests.length > 0);
  if (rest.length) result.push({ taskId: undefined, title: undefined, tests: rest });
  return result;
}

/** A task's status for its mark: from the server's progress, else from the latest run of this page. */
export function taskStatus(taskId: number, progress: ItemProgress | undefined): TaskStatus {
  return progress?.tasks[String(taskId)] ?? "untested";
}

export function taskStatusMark(status: TaskStatus): Status {
  return status === "passed" ? "passed" : status === "failed" ? "failed" : "untested";
}

/** "0.8 s", "12 s", "1 min 4 s". */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms) || ms < 0) return "";
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)} s`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

/** "14:02" today, "12 Nov 14:02" on another day, in the viewer's time zone. */
export function formatWhen(iso: string | undefined, now: Date): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return time;
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${time}`;
}

export function firstLine(text: string): string {
  return (
    text
      .split("\n")
      .find((line) => line.trim())
      ?.trim() ?? ""
  );
}

/** True when the run was made from exactly these files. */
export function ranFiles(run: Pick<RunRecord, "files">, files: Record<string, string>): boolean {
  const names = Object.keys(run.files);
  return names.length === Object.keys(files).length && names.every((name) => run.files[name] === files[name]);
}

export type { RunSummary };
