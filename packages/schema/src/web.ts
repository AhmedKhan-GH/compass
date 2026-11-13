/** The web app's own API, between the browser and apps/web. See docs/ARCHITECTURE.md. */
import { z } from "zod";
import { FileName } from "./ids.ts";
import { CircuitPort, JobError, JobState, RunReport, SOURCE_LIMITS } from "./runner.ts";

const SubmittedFiles = z.record(FileName, z.string().max(SOURCE_LIMITS.fileBytes));

export const StartRunRequest = z.strictObject({
  /** The solution file and any editable support files, by name. Other names are rejected. */
  files: SubmittedFiles,
  /** Run only this task's tests. Not allowed with `submit`. */
  taskId: z.number().int().min(1).optional(),
  /** True for a submission: all tests, and a pass completes the item. */
  submit: z.boolean().optional(),
});
export type StartRunRequest = z.infer<typeof StartRunRequest>;

export const RunKind = z.enum(["test", "submission"]);
export type RunKind = z.infer<typeof RunKind>;

export const RunRecord = z.strictObject({
  id: z.string(),
  courseId: z.string(),
  /** The item's UUID. */
  itemId: z.string(),
  itemSlug: z.string(),
  /** The item revision the run was made against. */
  revision: z.string(),
  kind: RunKind,
  taskId: z.number().int().optional(),
  /** Mirrors the runner job's state. */
  state: JobState,
  /** Jobs ahead in the queue, while queued. */
  position: z.number().int().optional(),
  /** ISO 8601. */
  createdAt: z.string(),
  finishedAt: z.string().optional(),
  durationMs: z.number().int().optional(),
  /** The files as submitted. */
  files: SubmittedFiles,
  /** Present when the state is `succeeded`. */
  report: RunReport.optional(),
  log: z.string().optional(),
  /** A VCD dump. */
  waveform: z.string().optional(),
  /** Present when the state is `failed`. */
  error: JobError.optional(),
});
export type RunRecord = z.infer<typeof RunRecord>;

/** A run in a history list: the record without its files, log and waveform. */
export const RunSummary = RunRecord.omit({ files: true, log: true, waveform: true });
export type RunSummary = z.infer<typeof RunSummary>;

export const RunHistoryPage = z.strictObject({
  runs: z.array(RunSummary),
  total: z.number().int(),
  nextCursor: z.string().nullable(),
});
export type RunHistoryPage = z.infer<typeof RunHistoryPage>;

export const StartCircuitRequest = z.strictObject({ files: SubmittedFiles });
export type StartCircuitRequest = z.infer<typeof StartCircuitRequest>;

export const CircuitRecord = z.strictObject({
  id: z.string(),
  courseId: z.string(),
  itemId: z.string(),
  state: JobState,
  createdAt: z.string(),
  /** Present when the state is `succeeded`: a DigitalJS top module. */
  circuit: z.record(z.string(), z.unknown()).optional(),
  ports: z.array(CircuitPort).optional(),
  warnings: z.string().optional(),
  error: JobError.optional(),
});
export type CircuitRecord = z.infer<typeof CircuitRecord>;

export const TaskStatus = z.enum(["untested", "passed", "failed"]);
export type TaskStatus = z.infer<typeof TaskStatus>;

export const ItemProgress = z.strictObject({
  status: z.enum(["not-started", "in-progress", "completed"]),
  /** By task id, from the latest run that covered each task. Empty for an item without tasks. */
  tasks: z.record(z.string(), TaskStatus),
  /** ISO 8601: when a submission first passed. */
  completedAt: z.string().optional(),
  runs: z.number().int(),
});
export type ItemProgress = z.infer<typeof ItemProgress>;

export const CourseProgress = z.strictObject({
  courseId: z.string(),
  /** By item slug. Items with no runs are absent. */
  items: z.record(z.string(), ItemProgress),
});
export type CourseProgress = z.infer<typeof CourseProgress>;
