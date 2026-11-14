/**
 * Runs: a test or a submission of the learner's files, checked by the runner service.
 *
 * Starting a run stores it in state `queued`, submits a job and returns at once. Reading a run that is not terminal
 * asks the runner for the job; when the job is terminal, the result and the progress it implies are stored in one
 * transaction. Settling is idempotent: a run already terminal is never written again, so concurrent reads are safe.
 */
import { randomUUID } from "node:crypto";
import {
  RunRecord,
  RunSummary,
  TaskMap,
  TestJobRequest,
  isTerminal,
  isTestRunnerKind,
  type IndexedCourse,
  type IndexedItem,
  type Job,
  type JobError,
  type JobState,
  type RunHistoryPage,
  type RunKind,
  type RunReport,
  type StartRunRequest,
} from "@compass/schema";
import type { RunnerClient, SeenJob } from "@compass/runner-client";
import { database, writeTransaction, type Db } from "./db.ts";
import { mergeWithStarter, validateSubmittedFiles, type SourceFiles } from "./files.ts";
import { HttpError } from "./http.ts";
import {
  LOG_BYTES,
  WAVEFORM_BYTES,
  awaitSubmission,
  boundError,
  differsFrom,
  headBytes,
  isAbort,
  observeJob,
  tailBytes,
  trackSubmission,
  unavailable,
  type Observation,
} from "./jobs.ts";
import { isPassingSubmission, progressDependencies, readResetSeq, taskVerdicts } from "./progress.ts";
import { isRunnerUnavailable, runnerClient } from "./runner.ts";

/** Runs kept per item; older finished runs are deleted unless progress depends on them. The old store kept all. */
export const RUNS_KEPT_PER_ITEM = 100;
export const HISTORY_PAGE_SIZE = 20;

type RunRow = {
  seq: number;
  id: string;
  course_id: string;
  item_id: string;
  item_slug: string;
  revision: string;
  kind: RunKind;
  task_id: number | null;
  tasks_json: string;
  files_json: string;
  job_id: string | null;
  state: JobState;
  position: number | null;
  created_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  report_json: string | null;
  log: string | null;
  waveform: string | null;
  error_json: string | null;
};
type SummaryRow = Omit<RunRow, "files_json" | "log" | "waveform">;

const SUMMARY_COLUMNS = `seq, id, course_id, item_id, item_slug, revision, kind, task_id, tasks_json, job_id, state,
  position, created_at, finished_at, duration_ms, report_json, error_json`;
const RECORD_COLUMNS = `${SUMMARY_COLUMNS}, files_json, log, waveform`;

function selectRun(db: Db, id: string): RunRow | undefined {
  return db.prepare(`SELECT ${RECORD_COLUMNS} FROM runs WHERE id = ?`).get(id) as RunRow | undefined;
}

function summaryFields(row: SummaryRow) {
  return {
    id: row.id,
    courseId: row.course_id,
    itemId: row.item_id,
    itemSlug: row.item_slug,
    revision: row.revision,
    kind: row.kind,
    ...(row.task_id !== null ? { taskId: row.task_id } : {}),
    state: row.state,
    ...(row.position !== null ? { position: row.position } : {}),
    createdAt: row.created_at,
    ...(row.finished_at !== null ? { finishedAt: row.finished_at } : {}),
    ...(row.duration_ms !== null ? { durationMs: row.duration_ms } : {}),
    ...(row.report_json !== null ? { report: JSON.parse(row.report_json) as unknown } : {}),
    ...(row.error_json !== null ? { error: JSON.parse(row.error_json) as unknown } : {}),
  };
}

/** The API's view of a stored run. The strict schema guarantees nothing else, such as the job request, leaks out. */
function toRecord(row: RunRow): RunRecord {
  return RunRecord.parse({
    ...summaryFields(row),
    files: JSON.parse(row.files_json) as unknown,
    ...(row.log !== null ? { log: row.log } : {}),
    ...(row.waveform !== null ? { waveform: row.waveform } : {}),
  });
}

function toSummary(row: SummaryRow): RunSummary {
  return RunSummary.parse(summaryFields(row));
}

/** The test job for the item: the submitted files over the starter files, with the checks and the task map. */
export function testJobRequest(
  course: IndexedCourse,
  item: IndexedItem,
  files: SourceFiles,
  taskId: number | undefined,
): TestJobRequest {
  const runner = item.runner ?? course.runner;
  if (!runner || !isTestRunnerKind(runner))
    throw new HttpError(
      409,
      "unsupported-runner",
      runner ? `This app does not know the test runner ${runner}.` : "This course has no test runner.",
    );
  // The implicit task of an item without [[task]] is the whole run: the runner gets no task map and no selection.
  const mapped = item.tasks.filter((task) => !task.implicit);
  const parsed = TestJobRequest.safeParse({
    runner,
    top: item.design.top,
    ...(item.design.sourceOrder ? { sourceOrder: item.design.sourceOrder } : {}),
    solution: item.design.solution,
    files: mergeWithStarter(item, files),
    checks: item.checks,
    itemKind: item.kind,
    ...(mapped.length > 0 ? { tasks: mapped.map((task) => ({ id: task.id, tests: task.tests })) } : {}),
    ...(taskId !== undefined && mapped.length > 0 ? { taskId } : {}),
  });
  if (!parsed.success) {
    // Only the paths are logged: the values include the checks.
    console.error(
      `The test job for ${course.id}/${item.slug} is invalid at`,
      parsed.error.issues.map((issue) => issue.path.join(".")),
    );
    throw new HttpError(409, "item-not-runnable", "This exercise cannot be run: its files exceed the runner's limits.");
  }
  return parsed.data;
}

type Settlement = {
  state: "succeeded" | "failed" | "cancelled";
  finishedAt: string;
  durationMs?: number;
  report?: RunReport;
  log?: string;
  waveform?: string;
  error?: JobError;
  imageId?: string;
};

function failed(error: JobError): Settlement {
  return { state: "failed", finishedAt: new Date().toISOString(), error };
}

/** What a terminal job means for the run, with the log and waveform bounded. */
function settlementFromJob(job: Job): Settlement {
  const finishedAt = job.finishedAt ?? new Date().toISOString();
  if (job.state === "succeeded") {
    const result = job.result;
    if (result?.kind !== "test")
      return { state: "failed", finishedAt, error: { kind: "invalid-result", message: "The runner returned no test result." } };
    return {
      state: "succeeded",
      finishedAt,
      durationMs: result.durationMs,
      report: result.report,
      log: tailBytes(result.log, LOG_BYTES),
      ...(result.waveform !== undefined ? { waveform: headBytes(result.waveform, WAVEFORM_BYTES) } : {}),
      imageId: result.imageId,
    };
  }
  if (job.state === "failed")
    return {
      state: "failed",
      finishedAt,
      error: boundError(job.error ?? { kind: "execution", message: "The runner reported a failure without details." }),
    };
  return { state: "cancelled", finishedAt };
}

/**
 * Stores the outcome of a run and the progress it implies, in one transaction. A run that is already terminal is
 * left as it is, which makes settling idempotent.
 */
function settleRun(db: Db, id: string, settlement: Settlement): RunRow | undefined {
  return writeTransaction(db, () => {
    const row = selectRun(db, id);
    if (!row || isTerminal(row.state)) return row;
    const taskId = row.task_id ?? undefined;
    const verdicts = taskVerdicts(TaskMap.parse(JSON.parse(row.tasks_json)), taskId, settlement);
    db.prepare(
      `UPDATE runs SET state = @state, position = NULL, finished_at = @finishedAt, duration_ms = @durationMs,
         report_json = @report, log = @log, waveform = @waveform, error_json = @error, image_id = @imageId,
         task_status_json = @verdicts
       WHERE id = @id`,
    ).run({
      id,
      state: settlement.state,
      finishedAt: settlement.finishedAt,
      durationMs: settlement.durationMs ?? null,
      report: settlement.report ? JSON.stringify(settlement.report) : null,
      log: settlement.log ?? null,
      waveform: settlement.waveform ?? null,
      error: settlement.error ? JSON.stringify(settlement.error) : null,
      imageId: settlement.imageId ?? null,
      verdicts: JSON.stringify(verdicts),
    });
    if (
      settlement.state === "succeeded" &&
      isPassingSubmission(row.kind, taskId, settlement.report) &&
      row.seq > readResetSeq(db, row.course_id, row.item_id)
    )
      db.prepare(
        `INSERT INTO completions (course_id, item_id, revision, run_id, completed_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`,
      ).run(row.course_id, row.item_id, row.revision, row.id, settlement.finishedAt);
    return selectRun(db, id);
  });
}

/** Mirrors a job that is not terminal yet. The state never moves back from running to queued. */
function recordOpenState(db: Db, id: string, state: "queued" | "running", position: number | undefined) {
  db.prepare(
    `UPDATE runs SET state = @state, position = @position
     WHERE id = @id AND (state = 'queued' OR (state = 'running' AND @state = 'running'))`,
  ).run({ id, state, position: state === "queued" ? (position ?? null) : null });
  return selectRun(db, id);
}

function applyObservation(db: Db, id: string, observation: Observation): RunRow | undefined {
  if (observation.kind === "open") return recordOpenState(db, id, observation.state, observation.position);
  if (observation.kind === "done") return settleRun(db, id, settlementFromJob(observation.job));
  return settleRun(db, id, failed(observation.error));
}

/** Deletes finished runs beyond the newest RUNS_KEPT_PER_ITEM, keeping those the item's progress depends on. */
function pruneRuns(db: Db, courseId: string, itemId: string, revision: string): void {
  const old = db
    .prepare("SELECT id, state FROM runs WHERE course_id = ? AND item_id = ? ORDER BY seq DESC LIMIT -1 OFFSET ?")
    .all(courseId, itemId, RUNS_KEPT_PER_ITEM) as { id: string; state: JobState }[];
  if (old.length === 0) return;
  const keep = progressDependencies(db, courseId, itemId, revision);
  const remove = db.prepare("DELETE FROM runs WHERE id = ?");
  for (const row of old) if (isTerminal(row.state) && !keep.has(row.id)) remove.run(row.id);
}

/** Hands the stored run to the runner and records the job. */
async function submitRun(db: Db, client: RunnerClient, id: string, request: TestJobRequest): Promise<void> {
  let job: Job;
  try {
    job = await client.submit(request);
  } catch (error) {
    if (isRunnerUnavailable(error)) {
      settleRun(db, id, failed(unavailable("The runner service could not be reached.")));
      return;
    }
    // No job exists: the queue is full or the runner refused the request. The run never happened.
    db.prepare("DELETE FROM runs WHERE id = ?").run(id);
    throw error;
  }
  db.prepare("UPDATE runs SET job_id = ? WHERE id = ?").run(job.id, id);
  if (isTerminal(job.state)) settleRun(db, id, settlementFromJob(job));
  else recordOpenState(db, id, job.state === "running" ? "running" : "queued", job.position);
}

/** Validates the request against the item, stores the run in state `queued`, submits its job and returns at once. */
export async function startRun(
  found: { course: IndexedCourse; item: IndexedItem },
  input: StartRunRequest,
): Promise<RunRecord> {
  const { course, item } = found;
  if (input.submit && input.taskId !== undefined)
    throw new HttpError(400, "invalid-task", "A submission runs every test; leave out taskId.");
  if (input.taskId !== undefined && !item.tasks.some((task) => task.id === input.taskId))
    throw new HttpError(400, "invalid-task", `This exercise has no task ${input.taskId}.`);
  const files = validateSubmittedFiles(item, input.files);
  const request = testJobRequest(course, item, files, input.taskId);
  const client = await runnerClient();
  const db = database();
  const id = randomUUID();
  writeTransaction(db, () => {
    db.prepare(
      `INSERT INTO runs (id, course_id, item_id, item_slug, revision, kind, task_id, tasks_json, files_json, state,
         created_at)
       VALUES (@id, @courseId, @itemId, @itemSlug, @revision, @kind, @taskId, @tasks, @files, 'queued', @createdAt)`,
    ).run({
      id,
      courseId: course.id,
      itemId: item.id,
      itemSlug: item.slug,
      revision: item.revision,
      kind: input.submit ? "submission" : "test",
      taskId: input.taskId ?? null,
      tasks: JSON.stringify(request.tasks ?? []),
      files: JSON.stringify(files),
      createdAt: new Date().toISOString(),
    });
    pruneRuns(db, course.id, item.id, item.revision);
  });
  await trackSubmission(id, () => submitRun(db, client, id, request));
  const row = selectRun(db, id);
  if (!row) throw new Error(`Run ${id} was deleted while it was being started.`);
  return toRecord(row);
}

/**
 * Reads a run. When it is not terminal, asks the runner for its job (holding up to `waitMs`) and stores what the
 * runner says. With `seen`, what the browser last saw, a stored run that already differs from it is returned at
 * once, and otherwise the runner holds only until the job differs from it. Undefined when there is no such run.
 */
export async function readRun(
  id: string,
  options: { waitMs?: number; seen?: SeenJob; signal?: AbortSignal } = {},
): Promise<RunRecord | undefined> {
  const db = database();
  let row = selectRun(db, id);
  // A run without a job id is being submitted by this process, or its submission was lost in a restart.
  if (row && !isTerminal(row.state) && row.job_id === null && (await awaitSubmission(id))) row = selectRun(db, id);
  if (!row) return undefined;
  if (isTerminal(row.state)) return toRecord(row);
  if (row.job_id === null) {
    const settled = settleRun(db, id, failed(unavailable("The run was never handed to the runner.")));
    return settled && toRecord(settled);
  }
  if (options.seen && differsFrom({ state: row.state, position: row.position ?? undefined }, options.seen))
    return toRecord(row);
  let observation: Observation;
  try {
    observation = await observeJob(row.job_id, {
      waitMs: options.waitMs ?? 0,
      ...(options.seen ? { seen: options.seen } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    // The browser went away during a long wait; nothing changed.
    if (isAbort(error, options.signal)) return toRecord(selectRun(db, id) ?? row);
    throw error;
  }
  const updated = applyObservation(db, id, observation);
  return updated && toRecord(updated);
}

/** The item's runs, newest first, a page at a time. The cursor is opaque to the browser. */
export function runHistory(courseId: string, itemId: string, cursor: string | null): RunHistoryPage {
  let before = Number.MAX_SAFE_INTEGER;
  if (cursor !== null && cursor !== "") {
    if (!/^[1-9]\d{0,14}$/.test(cursor)) throw new HttpError(400, "invalid-cursor", "The history cursor is not valid.");
    before = Number(cursor);
  }
  const db = database();
  return db.transaction(() => {
    const { total } = db
      .prepare("SELECT COUNT(*) AS total FROM runs WHERE course_id = ? AND item_id = ?")
      .get(courseId, itemId) as { total: number };
    const rows = db
      .prepare(
        `SELECT ${SUMMARY_COLUMNS} FROM runs WHERE course_id = ? AND item_id = ? AND seq < ?
         ORDER BY seq DESC LIMIT ?`,
      )
      .all(courseId, itemId, before, HISTORY_PAGE_SIZE + 1) as SummaryRow[];
    const page = rows.slice(0, HISTORY_PAGE_SIZE);
    const last = page.at(-1);
    return {
      runs: page.map(toSummary),
      total,
      nextCursor: rows.length > HISTORY_PAGE_SIZE && last ? String(last.seq) : null,
    };
  })();
}
