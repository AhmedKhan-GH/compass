/**
 * The adapter between a TestJobRequest and the in-image runner of iverilog-cocotb@1, which keeps the legacy
 * exercise shape: it reads `.meta/config.json` and `.meta/request.json` and writes a version 2 or version 3
 * `results.json`. Version 3 is the version 2 report with a `task_id` on every test.
 */
import { RunReport, type TestJobRequest, type TestResult } from "@compass/schema";
import { JobFailure } from "./failure.ts";

/** The `.meta/config.json` the in-image runner reads. */
export type LegacyConfig = {
  files: { solution: [string]; test: [string]; editor?: string[] };
  custom: {
    compass: {
      runner: string;
      source_order?: string[];
      top_module: string;
      tasks?: { id: number; tests: string[] }[];
    };
  };
};

/** The `.meta/request.json` the in-image runner reads. */
export type LegacyRequest = { kind: "concept" | "practice"; task_id?: number };

export function legacyConfig(request: TestJobRequest): LegacyConfig {
  const support = Object.keys(request.files).filter((name) => name !== request.solution);
  return {
    files: {
      solution: [request.solution],
      test: [request.checks.name],
      ...(support.length ? { editor: support } : {}),
    },
    custom: {
      compass: {
        runner: {
          "iverilog-cocotb@1": "icarus-cocotb-v1",
          "iverilog-native@1": "icarus-native-v1",
          "ghdl-cocotb@1": "ghdl-cocotb-v1",
          "ghdl-native@1": "ghdl-native-v1",
        }[request.runner],
        ...(request.sourceOrder ? { source_order: request.sourceOrder } : {}),
        top_module: request.top,
        ...(request.tasks ? { tasks: request.tasks.map((task) => ({ id: task.id, tests: [...task.tests] })) } : {}),
      },
    },
  };
}

export function legacyRequest(request: TestJobRequest): LegacyRequest {
  return { kind: request.itemKind, ...(request.taskId !== undefined ? { task_id: request.taskId } : {}) };
}

/** The report version the image writes for this request. */
export function resultVersion(request: Pick<TestJobRequest, "tasks" | "taskId">): 2 | 3 {
  return request.tasks !== undefined || request.taskId !== undefined ? 3 : 2;
}

export type LegacyResults =
  | { version: 2 | 3; status: "pass" | "fail"; tests: TestResult[] }
  | { version: 2 | 3; status: "error"; message: string };

const INVALID_REPORT = "The runner returned an invalid test report.";

/** Validates a parsed `results.json`. An empty, inconsistent or malformed report never counts as passing. */
export function parseResults(value: unknown): LegacyResults {
  const invalid = (): never => {
    throw new JobFailure("invalid-result", INVALID_REPORT);
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid();
  const report = value as Record<string, unknown>;
  if (report.version !== 2 && report.version !== 3) return invalid();
  const version = report.version;
  if (report.status === "error") {
    if (typeof report.message !== "string" || !report.message.trim()) return invalid();
    return { version, status: "error", message: report.message };
  }
  if ((report.status !== "pass" && report.status !== "fail") || !Array.isArray(report.tests) || !report.tests.length)
    return invalid();
  const tests = report.tests.map((test: unknown): TestResult => {
    if (!test || typeof test !== "object") return invalid();
    const t = test as Record<string, unknown>;
    if (
      typeof t.name !== "string" ||
      !t.name.trim() ||
      typeof t.test_code !== "string" ||
      !t.test_code.trim() ||
      (t.status !== "pass" && t.status !== "fail" && t.status !== "error") ||
      (t.status !== "pass" && (typeof t.message !== "string" || !t.message.trim()))
    )
      return invalid();
    if (version === 3 && (typeof t.task_id !== "number" || !Number.isSafeInteger(t.task_id) || t.task_id < 1))
      return invalid();
    if (version === 2 && "task_id" in t) return invalid();
    return {
      name: t.name,
      status: t.status,
      test_code: t.test_code,
      ...(typeof t.message === "string" ? { message: t.message } : {}),
      ...(version === 3 ? { task_id: t.task_id as number } : {}),
    };
  });
  if ((report.status === "pass") !== tests.every((t) => t.status === "pass")) return invalid();
  return { version, status: report.status, tests };
}

/** Rejects a report whose version or task ids do not match what the request selected. */
export function checkSelection(results: LegacyResults, request: Pick<TestJobRequest, "tasks" | "taskId">): void {
  const { tasks, taskId } = request;
  const unexpected =
    results.version !== resultVersion(request) ||
    (results.version === 3 &&
      results.status !== "error" &&
      ((taskId !== undefined && results.tests.some((test) => test.task_id !== taskId)) ||
        (tasks !== undefined &&
          tasks
            .filter((task) => taskId === undefined || task.id === taskId)
            .some((task) => results.tests.filter((test) => test.task_id === task.id).length !== task.tests.length)) ||
        (tasks !== undefined && results.tests.some((test) => !tasks.some((task) => task.id === test.task_id)))));
  if (unexpected)
    throw new JobFailure("invalid-result", "The simulator returned results for an unexpected task selection.");
}

/** Validates a parsed `results.json` against the request and maps it to a RunReport. */
export function toRunReport(value: unknown, request: Pick<TestJobRequest, "tasks" | "taskId">): RunReport {
  const results = parseResults(value);
  checkSelection(results, request);
  const report =
    results.status === "error"
      ? { status: results.status, message: results.message }
      : { status: results.status, tests: results.tests };
  const parsed = RunReport.safeParse(report);
  if (!parsed.success) throw new JobFailure("invalid-result", INVALID_REPORT);
  return parsed.data;
}
