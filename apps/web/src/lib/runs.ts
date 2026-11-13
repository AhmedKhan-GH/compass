/**
 * What a run means for the interface: its status mark, its counts, its tests by task. Pure functions over the
 * records of packages/schema.
 */
import type { IndexedTask, ItemProgress, RunRecord, RunSummary, TaskStatus, TestResult } from "@compass/schema";
import type { Status, Tone } from "@compass/ui";

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
export type TaskGroup = { taskId: number | undefined; title: string | undefined; tests: TestResult[] };

/**
 * The tests of a report grouped by task, in task order, with tests that name no task at the end. With
 * `includeEmpty`, tasks the run did not cover are kept with no tests.
 */
export function testsByTask(
  tests: readonly TestResult[],
  tasks: readonly Pick<IndexedTask, "id" | "title" | "tests">[],
  options: { includeEmpty?: boolean } = {},
): TaskGroup[] {
  const groups: TaskGroup[] = tasks.map((task) => ({ taskId: task.id, title: task.title, tests: [] }));
  const rest: TestResult[] = [];
  for (const test of tests) {
    const group = groups.find((candidate) => candidate.taskId !== undefined && candidate.taskId === test.task_id);
    if (group) group.tests.push(test);
    else rest.push(test);
  }
  const result = options.includeEmpty ? groups : groups.filter((group) => group.tests.length > 0);
  if (rest.length) result.push({ taskId: undefined, title: undefined, tests: rest });
  return result;
}

export type Outcome = { tone: Tone; status: Status; title: string; detail?: string };

/**
 * A finished run in words, for the banner and the status bar: "All 3 tests passed", or "1 of 3 failed" with the
 * first failure as the detail ("Task 2 · The indicator is on after settling · Expected out = 1…").
 */
export function runOutcome(
  run: Pick<RunRecord, "state" | "report" | "error">,
  tasks: readonly Pick<IndexedTask, "id" | "title">[] = [],
): Outcome {
  if (run.state === "queued") return { tone: "neutral", status: "queued", title: "Queued" };
  if (run.state === "running") return { tone: "running", status: "running", title: "Running" };
  if (run.state === "cancelled") return { tone: "neutral", status: "cancelled", title: "Cancelled" };
  if (run.state === "failed") {
    const message = run.error?.message ? firstLine(run.error.message) : undefined;
    const outcome: Outcome = {
      tone: "warning",
      status: run.error?.kind === "unavailable" ? "unavailable" : "error",
      title: failureTitle(run.error?.kind),
    };
    return message ? { ...outcome, detail: message } : outcome;
  }
  const report = run.report;
  if (!report) return { tone: "warning", status: "error", title: "No report" };
  if (report.status === "error")
    return { tone: "failed", status: "error", title: "Error", detail: firstLine(report.message) };
  const total = report.tests.length;
  const failing = report.tests.filter((test) => test.status !== "pass");
  if (!failing.length)
    return { tone: "passed", status: "passed", title: total === 1 ? "The test passed" : `All ${total} tests passed` };
  const first = failing[0];
  const task = tasks.find((candidate) => candidate.id === first?.task_id);
  const detail = first
    ? [task ? `Task ${task.id}` : undefined, first.name, first.message ? firstLine(first.message) : undefined]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  const outcome: Outcome = { tone: "failed", status: "failed", title: `${failing.length} of ${total} failed` };
  return detail ? { ...outcome, detail } : outcome;
}

/**
 * The status of each task a finished run covered: passed when all its tests passed, failed otherwise. A run that
 * produced no test results (a compile error) fails every task it covered.
 */
export function taskStatusesFromRun(
  run: Pick<RunRecord, "state" | "report" | "taskId">,
  tasks: readonly Pick<IndexedTask, "id">[],
): Record<string, TaskStatus> {
  const result: Record<string, TaskStatus> = {};
  if (run.state !== "succeeded" || !run.report) return result;
  const covered = tasks.filter((task) => run.taskId === undefined || run.taskId === task.id);
  for (const task of covered) {
    if (run.report.status === "error") {
      result[String(task.id)] = "failed";
      continue;
    }
    const tests = run.report.tests.filter((test) => test.task_id === task.id);
    if (tests.length) result[String(task.id)] = tests.every((test) => test.status === "pass") ? "passed" : "failed";
  }
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
