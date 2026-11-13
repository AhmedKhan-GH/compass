/**
 * Progress, derived from stored runs of each item's current revision made since its last reset.
 *
 * - A task's status comes from the newest such run that covered it.
 * - An item is completed when a submission of its current revision passed (recorded in `completions`).
 * - A reset moves the item's marker past every existing run and deletes its completions; history stays.
 */
import { z } from "zod";
import {
  TaskStatus,
  type CourseProgress,
  type CourseView,
  type ItemProgress,
  type ItemView,
  type JobError,
  type RunKind,
  type RunReport,
  type TaskMap,
} from "@compass/schema";
import { database, writeTransaction, type Db } from "./db.ts";

/** The verdict a finished run gives each task it covered, by task id. */
export type TaskVerdicts = Record<string, Exclude<TaskStatus, "untested">>;
const StoredVerdicts = z.record(z.string(), TaskStatus.exclude(["untested"]));

/**
 * The tasks a finished run covered and whether each passed.
 * A task-scoped run covers its task. A full run covers the tasks its report has tests for, or every task when
 * the design did not compile (`error` report) or the simulation timed out. Runs that failed for reasons
 * outside the learner's code (runner unavailable, execution errors) and cancelled runs cover nothing.
 */
export function taskVerdicts(
  tasks: TaskMap,
  taskId: number | undefined,
  outcome: { report?: RunReport; error?: JobError },
): TaskVerdicts {
  const verdicts: TaskVerdicts = {};
  const selected = tasks.filter((task) => taskId === undefined || task.id === taskId);
  const { report } = outcome;
  if (!report) {
    if (outcome.error?.kind === "timeout") for (const task of selected) verdicts[String(task.id)] = "failed";
    return verdicts;
  }
  for (const task of selected) {
    if (report.status === "error") {
      verdicts[String(task.id)] = "failed";
      continue;
    }
    const tests = report.tests.filter(
      (test) => test.task_id === task.id || (tasks.length === 1 && test.task_id === undefined),
    );
    if (tests.length === 0 && taskId === undefined) continue;
    verdicts[String(task.id)] =
      tests.length > 0 && tests.length === task.tests.length && tests.every((test) => test.status === "pass")
        ? "passed"
        : "failed";
  }
  return verdicts;
}

/** A submission over every test, all of which passed. */
export function isPassingSubmission(kind: RunKind, taskId: number | undefined, report: RunReport | undefined): boolean {
  return (
    kind === "submission" &&
    taskId === undefined &&
    report?.status === "pass" &&
    report.tests.length > 0 &&
    report.tests.every((test) => test.status === "pass")
  );
}

/** What progress needs to know about one stored run. */
export type ProgressRun = { seq: number; revision: string; verdicts: TaskVerdicts | undefined };

/** Progress of one item from its runs, newest first, its reset marker and its completion of the current revision. */
export function deriveItemProgress(
  item: Pick<ItemView, "revision" | "tasks">,
  runs: readonly ProgressRun[],
  resetSeq: number,
  completedAt: string | undefined,
): ItemProgress {
  const counted = runs.filter((run) => run.revision === item.revision && run.seq > resetSeq);
  const tasks: ItemProgress["tasks"] = {};
  for (const task of item.tasks) {
    const key = String(task.id);
    tasks[key] = counted.find((run) => run.verdicts?.[key] !== undefined)?.verdicts?.[key] ?? "untested";
  }
  return {
    status: completedAt !== undefined ? "completed" : counted.length > 0 ? "in-progress" : "not-started",
    tasks,
    ...(completedAt !== undefined ? { completedAt } : {}),
    runs: counted.length,
  };
}

type ProgressRow = { item_id: string; seq: number; revision: string; task_status_json: string | null };

function toProgressRun(row: ProgressRow): ProgressRun {
  const verdicts = row.task_status_json === null ? undefined : StoredVerdicts.parse(JSON.parse(row.task_status_json));
  return { seq: row.seq, revision: row.revision, verdicts };
}

export function readResetSeq(db: Db, courseId: string, itemId: string): number {
  const row = db
    .prepare("SELECT reset_seq FROM item_state WHERE course_id = ? AND item_id = ?")
    .get(courseId, itemId) as { reset_seq: number } | undefined;
  return row?.reset_seq ?? 0;
}

function readCompletedAt(db: Db, courseId: string, itemId: string, revision: string): string | undefined {
  const row = db
    .prepare("SELECT completed_at FROM completions WHERE course_id = ? AND item_id = ? AND revision = ?")
    .get(courseId, itemId, revision) as { completed_at: string } | undefined;
  return row?.completed_at;
}

function readItemProgress(db: Db, courseId: string, item: ItemView): ItemProgress {
  const rows = db
    .prepare(
      `SELECT item_id, seq, revision, task_status_json FROM runs
       WHERE course_id = ? AND item_id = ? AND revision = ? ORDER BY seq DESC`,
    )
    .all(courseId, item.id, item.revision) as ProgressRow[];
  return deriveItemProgress(
    item,
    rows.map(toProgressRun),
    readResetSeq(db, courseId, item.id),
    readCompletedAt(db, courseId, item.id, item.revision),
  );
}

export function itemProgress(courseId: string, item: ItemView): ItemProgress {
  const db = database();
  return db.transaction(() => readItemProgress(db, courseId, item))();
}

/** Progress of every item of the course that has runs or a completion, by item slug. */
export function courseProgress(course: CourseView): CourseProgress {
  const db = database();
  return db.transaction(() => {
    const runs = new Map<string, ProgressRun[]>();
    const rows = db
      .prepare("SELECT item_id, seq, revision, task_status_json FROM runs WHERE course_id = ? ORDER BY seq DESC")
      .all(course.id) as ProgressRow[];
    for (const row of rows) {
      const list = runs.get(row.item_id) ?? [];
      list.push(toProgressRun(row));
      runs.set(row.item_id, list);
    }
    const resets = new Map(
      (
        db.prepare("SELECT item_id, reset_seq FROM item_state WHERE course_id = ?").all(course.id) as {
          item_id: string;
          reset_seq: number;
        }[]
      ).map((row) => [row.item_id, row.reset_seq]),
    );
    const completions = new Map(
      (
        db.prepare("SELECT item_id, revision, completed_at FROM completions WHERE course_id = ?").all(course.id) as {
          item_id: string;
          revision: string;
          completed_at: string;
        }[]
      ).map((row) => [`${row.item_id} ${row.revision}`, row.completed_at]),
    );
    const items: CourseProgress["items"] = {};
    for (const item of course.items) {
      const progress = deriveItemProgress(
        item,
        runs.get(item.id) ?? [],
        resets.get(item.id) ?? 0,
        completions.get(`${item.id} ${item.revision}`),
      );
      if (progress.status !== "not-started") items[item.slug] = progress;
    }
    return { courseId: course.id, items };
  })();
}

/** Starts the item over: earlier runs stop counting and its completions are removed. Its run history stays. */
export function resetItem(courseId: string, item: ItemView): ItemProgress {
  const db = database();
  return writeTransaction(db, () => {
    const { seq } = db.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM runs").get() as { seq: number };
    db.prepare(
      `INSERT INTO item_state (course_id, item_id, reset_seq, reset_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (course_id, item_id) DO UPDATE SET reset_seq = excluded.reset_seq, reset_at = excluded.reset_at`,
    ).run(courseId, item.id, seq, new Date().toISOString());
    db.prepare("DELETE FROM completions WHERE course_id = ? AND item_id = ?").run(courseId, item.id);
    return readItemProgress(db, courseId, item);
  });
}

/**
 * The runs the item's progress depends on, which pruning must keep: for the given revision, the newest run since
 * the reset that covered each task, and every run that completed the item.
 */
export function progressDependencies(db: Db, courseId: string, itemId: string, revision: string): Set<string> {
  const resetSeq = readResetSeq(db, courseId, itemId);
  const rows = db
    .prepare(
      `SELECT id, seq, task_status_json FROM runs
       WHERE course_id = ? AND item_id = ? AND revision = ? AND seq > ? AND task_status_json IS NOT NULL
       ORDER BY seq DESC`,
    )
    .all(courseId, itemId, revision, resetSeq) as { id: string; seq: number; task_status_json: string }[];
  const keep = new Set<string>();
  const covered = new Set<string>();
  for (const row of rows)
    for (const task of Object.keys(StoredVerdicts.parse(JSON.parse(row.task_status_json))))
      if (!covered.has(task)) {
        covered.add(task);
        keep.add(row.id);
      }
  const completions = db
    .prepare("SELECT run_id FROM completions WHERE course_id = ? AND item_id = ?")
    .all(courseId, itemId) as { run_id: string }[];
  for (const { run_id } of completions) keep.add(run_id);
  return keep;
}
