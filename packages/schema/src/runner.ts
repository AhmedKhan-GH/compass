/** The runner service's HTTP API. See docs/ARCHITECTURE.md. */
import { z } from "zod";
import { FileName, Identifier } from "./ids.ts";
import { ItemKind } from "./pack.ts";

export const DEFAULT_RUNNER_URL = "http://127.0.0.1:3101";
export const DEFAULT_RUNNER_PORT = 3101;

/** Limits on what a job may carry. The web app and the content check enforce the same limits. */
export const SOURCE_LIMITS = {
  /** Bytes per file. */
  fileBytes: 64 * 1024,
  /** Files per job, the checks file excluded. */
  files: 16,
  /** Bytes of the checks file. */
  checksBytes: 256 * 1024,
} as const;
export const MAX_WAIT_MS = 30_000;

const SourceFiles = z
  .record(FileName, z.string().max(SOURCE_LIMITS.fileBytes))
  .refine((files) => Object.keys(files).length <= SOURCE_LIMITS.files, "Too many files.");

export const TaskMap = z.array(
  z.strictObject({ id: z.number().int().min(1), tests: z.array(Identifier).min(1) }),
);
export type TaskMap = z.infer<typeof TaskMap>;

export const TestJobRequest = z.strictObject({
  runner: z.literal("iverilog-cocotb@1"),
  /** The top module name. */
  top: Identifier,
  /** The name, in `files`, of the main source file. */
  solution: FileName,
  /** Every source and support file by name, the solution included. */
  files: SourceFiles,
  checks: z.strictObject({ name: FileName, content: z.string().min(1).max(SOURCE_LIMITS.checksBytes) }),
  itemKind: ItemKind,
  /** The task map of the item; omitted when the item is checked as a whole. */
  tasks: TaskMap.optional(),
  /** Run only this task's tests. */
  taskId: z.number().int().min(1).optional(),
});
export type TestJobRequest = z.infer<typeof TestJobRequest>;

export const CircuitJobRequest = z.strictObject({
  runner: z.literal("yosys-digitaljs@1"),
  top: Identifier,
  solution: FileName,
  files: SourceFiles,
});
export type CircuitJobRequest = z.infer<typeof CircuitJobRequest>;

export const JobRequest = z.discriminatedUnion("runner", [TestJobRequest, CircuitJobRequest]);
export type JobRequest = z.infer<typeof JobRequest>;

export const TestResult = z.strictObject({
  /** The test's title: its docstring, or its function name with spaces. */
  name: z.string().min(1),
  status: z.enum(["pass", "fail", "error"]),
  /** The source of the test function. */
  test_code: z.string().min(1),
  /** Present unless the test passed. */
  message: z.string().optional(),
  /** Present when the item has tasks. */
  task_id: z.number().int().min(1).optional(),
});
export type TestResult = z.infer<typeof TestResult>;

/** What the sandbox reported. `error` means no test ran to a verdict, for example a compile error. */
export const RunReport = z.discriminatedUnion("status", [
  z.strictObject({ status: z.literal("pass"), tests: z.array(TestResult).min(1) }),
  z.strictObject({ status: z.literal("fail"), tests: z.array(TestResult).min(1) }),
  z.strictObject({ status: z.literal("error"), message: z.string().min(1) }),
]);
export type RunReport = z.infer<typeof RunReport>;

export const TestJobResult = z.strictObject({
  kind: z.literal("test"),
  report: RunReport,
  /** The tail of the simulation log. */
  log: z.string(),
  /** A VCD dump, bounded in size; absent when the design did not compile. */
  waveform: z.string().optional(),
  imageId: z.string(),
  durationMs: z.number().int().min(0),
});
export type TestJobResult = z.infer<typeof TestJobResult>;

export const CircuitPort = z.strictObject({
  name: z.string(),
  direction: z.enum(["input", "output"]),
  bits: z.number().int().min(1),
});
export type CircuitPort = z.infer<typeof CircuitPort>;

export const CircuitJobResult = z.strictObject({
  kind: z.literal("circuit"),
  /** A DigitalJS top module, as yosys2digitaljs produced it. */
  circuit: z.record(z.string(), z.unknown()),
  ports: z.array(CircuitPort),
  warnings: z.string(),
  imageId: z.string(),
  durationMs: z.number().int().min(0),
});
export type CircuitJobResult = z.infer<typeof CircuitJobResult>;

export const JobResult = z.discriminatedUnion("kind", [TestJobResult, CircuitJobResult]);
export type JobResult = z.infer<typeof JobResult>;

export const JobState = z.enum(["queued", "running", "succeeded", "failed", "cancelled"]);
export type JobState = z.infer<typeof JobState>;
export const TERMINAL_JOB_STATES: readonly JobState[] = ["succeeded", "failed", "cancelled"];
export function isTerminal(state: JobState): boolean {
  return TERMINAL_JOB_STATES.includes(state);
}

export const JobErrorKind = z.enum(["unavailable", "timeout", "execution", "invalid-result", "design"]);
export type JobErrorKind = z.infer<typeof JobErrorKind>;

export const JobError = z.strictObject({
  kind: JobErrorKind,
  message: z.string(),
  /** Tool output that explains a `design` error. */
  diagnostics: z.string().optional(),
});
export type JobError = z.infer<typeof JobError>;

export const Job = z.strictObject({
  id: z.string().min(1),
  runner: z.string(),
  state: JobState,
  /** ISO 8601. */
  createdAt: z.string(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  /** Jobs ahead in the queue, while queued. */
  position: z.number().int().min(0).optional(),
  /** Present exactly when the state is `succeeded`. */
  result: JobResult.optional(),
  /** Present exactly when the state is `failed`. */
  error: JobError.optional(),
});
export type Job = z.infer<typeof Job>;

export const JobResponse = z.strictObject({ job: Job });
export type JobResponse = z.infer<typeof JobResponse>;

export const RunnerHealth = z.strictObject({
  status: z.literal("ok"),
  runners: z.array(
    z.strictObject({
      kind: z.string(),
      purpose: z.enum(["test", "circuit"]),
      image: z.string(),
      /** False when Docker is unreachable or the image has not been built. */
      available: z.boolean(),
      imageId: z.string().optional(),
    }),
  ),
  queue: z.strictObject({
    queued: z.number().int(),
    running: z.number().int(),
    concurrency: z.number().int(),
    capacity: z.number().int(),
  }),
});
export type RunnerHealth = z.infer<typeof RunnerHealth>;

export const ApiError = z.strictObject({
  error: z.strictObject({ code: z.string(), message: z.string() }),
});
export type ApiError = z.infer<typeof ApiError>;
