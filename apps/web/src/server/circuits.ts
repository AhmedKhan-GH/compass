/**
 * Circuits: the DigitalJS view of the learner's design, built by the course's circuit runner.
 *
 * A circuit is keyed by the item revision, the circuit runner and the hash of the files built. Starting one for a
 * key that already has a circuit built, being built, or rejected as a design returns that circuit; other failures
 * are tried again. Reading follows the same flow as a run.
 */
import { randomUUID } from "node:crypto";
import {
  CircuitJobRequest,
  CircuitRecord,
  JobError,
  isCircuitRunnerKind,
  isTerminal,
  type CircuitPort,
  type IndexedCourse,
  type IndexedItem,
  type Job,
  type JobState,
  type StartCircuitRequest,
} from "@compass/schema";
import type { RunnerClient } from "@compass/runner-client";
import { database, writeTransaction, type Db } from "./db.ts";
import { mergeWithStarter, sourceHash, validateSubmittedFiles } from "./files.ts";
import { HttpError } from "./http.ts";
import {
  CIRCUIT_BYTES,
  DIAGNOSTICS_BYTES,
  awaitSubmission,
  boundError,
  headBytes,
  isAbort,
  observeJob,
  trackSubmission,
  unavailable,
  type Observation,
} from "./jobs.ts";
import { isRunnerUnavailable, runnerClient } from "./runner.ts";

/** Circuits kept per item; older finished ones are deleted. */
export const CIRCUITS_KEPT_PER_ITEM = 20;

type CircuitRow = {
  seq: number;
  id: string;
  course_id: string;
  item_id: string;
  revision: string;
  runner: string;
  source_hash: string;
  job_id: string | null;
  state: JobState;
  created_at: string;
  finished_at: string | null;
  circuit_json: string | null;
  ports_json: string | null;
  warnings: string | null;
  error_json: string | null;
};

function selectCircuit(db: Db, id: string): CircuitRow | undefined {
  return db.prepare("SELECT * FROM circuits WHERE id = ?").get(id) as CircuitRow | undefined;
}

function toRecord(row: CircuitRow): CircuitRecord {
  return CircuitRecord.parse({
    id: row.id,
    courseId: row.course_id,
    itemId: row.item_id,
    state: row.state,
    createdAt: row.created_at,
    ...(row.circuit_json !== null ? { circuit: JSON.parse(row.circuit_json) as unknown } : {}),
    ...(row.ports_json !== null ? { ports: JSON.parse(row.ports_json) as unknown } : {}),
    ...(row.warnings !== null ? { warnings: row.warnings } : {}),
    ...(row.error_json !== null ? { error: JSON.parse(row.error_json) as unknown } : {}),
  });
}

/** A circuit worth returning again for the same files: built, being built, or rejected as a design. */
function reusable(row: CircuitRow): boolean {
  if (!isTerminal(row.state) || row.state === "succeeded") return true;
  return row.state === "failed" && row.error_json !== null && JobError.parse(JSON.parse(row.error_json)).kind === "design";
}

type Settlement = {
  state: "succeeded" | "failed" | "cancelled";
  finishedAt: string;
  circuit?: Record<string, unknown>;
  ports?: CircuitPort[];
  warnings?: string;
  error?: JobError;
  imageId?: string;
};

function failed(error: JobError): Settlement {
  return { state: "failed", finishedAt: new Date().toISOString(), error };
}

function settlementFromJob(job: Job): Settlement {
  const finishedAt = job.finishedAt ?? new Date().toISOString();
  if (job.state === "succeeded") {
    const result = job.result;
    if (result?.kind !== "circuit")
      return { state: "failed", finishedAt, error: { kind: "invalid-result", message: "The runner returned no circuit." } };
    if (Buffer.byteLength(JSON.stringify(result.circuit), "utf8") > CIRCUIT_BYTES)
      return { state: "failed", finishedAt, error: { kind: "invalid-result", message: "The circuit is too large to show." } };
    return {
      state: "succeeded",
      finishedAt,
      circuit: result.circuit,
      ports: result.ports,
      warnings: headBytes(result.warnings, DIAGNOSTICS_BYTES),
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

/** Stores a circuit's outcome once; a circuit already terminal is left as it is. */
function settleCircuit(db: Db, id: string, settlement: Settlement): CircuitRow | undefined {
  return writeTransaction(db, () => {
    const row = selectCircuit(db, id);
    if (!row || isTerminal(row.state)) return row;
    db.prepare(
      `UPDATE circuits SET state = @state, finished_at = @finishedAt, circuit_json = @circuit, ports_json = @ports,
         warnings = @warnings, error_json = @error, image_id = @imageId
       WHERE id = @id`,
    ).run({
      id,
      state: settlement.state,
      finishedAt: settlement.finishedAt,
      circuit: settlement.circuit ? JSON.stringify(settlement.circuit) : null,
      ports: settlement.ports ? JSON.stringify(settlement.ports) : null,
      warnings: settlement.warnings ?? null,
      error: settlement.error ? JSON.stringify(settlement.error) : null,
      imageId: settlement.imageId ?? null,
    });
    return selectCircuit(db, id);
  });
}

function recordOpenState(db: Db, id: string, state: "queued" | "running"): CircuitRow | undefined {
  db.prepare(
    `UPDATE circuits SET state = @state
     WHERE id = @id AND (state = 'queued' OR (state = 'running' AND @state = 'running'))`,
  ).run({ id, state });
  return selectCircuit(db, id);
}

function applyObservation(db: Db, id: string, observation: Observation): CircuitRow | undefined {
  if (observation.kind === "open") return recordOpenState(db, id, observation.state);
  if (observation.kind === "done") return settleCircuit(db, id, settlementFromJob(observation.job));
  return settleCircuit(db, id, failed(observation.error));
}

async function submitCircuit(db: Db, client: RunnerClient, id: string, request: CircuitJobRequest): Promise<void> {
  let job: Job;
  try {
    job = await client.submit(request);
  } catch (error) {
    if (isRunnerUnavailable(error)) {
      settleCircuit(db, id, failed(unavailable("The runner service could not be reached.")));
      return;
    }
    db.prepare("DELETE FROM circuits WHERE id = ?").run(id);
    throw error;
  }
  db.prepare("UPDATE circuits SET job_id = ? WHERE id = ?").run(job.id, id);
  if (isTerminal(job.state)) settleCircuit(db, id, settlementFromJob(job));
  else recordOpenState(db, id, job.state === "running" ? "running" : "queued");
}

function pruneCircuits(db: Db, courseId: string, itemId: string): void {
  const old = db
    .prepare("SELECT id, state FROM circuits WHERE course_id = ? AND item_id = ? ORDER BY seq DESC LIMIT -1 OFFSET ?")
    .all(courseId, itemId, CIRCUITS_KEPT_PER_ITEM) as { id: string; state: JobState }[];
  const remove = db.prepare("DELETE FROM circuits WHERE id = ?");
  for (const row of old) if (isTerminal(row.state)) remove.run(row.id);
}

/** Starts a circuit for the submitted files, or returns the stored one for the same revision and files. */
export async function startCircuit(
  found: { course: IndexedCourse; item: IndexedItem },
  input: StartCircuitRequest,
): Promise<CircuitRecord> {
  const { course, item } = found;
  if (course.circuit === undefined) throw new HttpError(404, "no-circuit", "This course has no circuit view.");
  if (!isCircuitRunnerKind(course.circuit))
    throw new HttpError(409, "unsupported-runner", `This app does not know the circuit runner ${course.circuit}.`);
  if (!item.design.schematic) throw new HttpError(409, "no-schematic", "This exercise has no circuit view.");
  const files = mergeWithStarter(item, validateSubmittedFiles(item, input.files));
  const request = CircuitJobRequest.safeParse({
    runner: course.circuit,
    top: item.design.top,
    solution: item.design.solution,
    files,
  });
  if (!request.success)
    throw new HttpError(409, "item-not-runnable", "This exercise cannot be built: its files exceed the runner's limits.");
  const hash = sourceHash(files);
  const client = await runnerClient();
  const db = database();
  const { id, created } = writeTransaction(db, () => {
    const existing = db
      .prepare(
        `SELECT * FROM circuits
         WHERE course_id = ? AND item_id = ? AND revision = ? AND runner = ? AND source_hash = ?`,
      )
      .get(course.id, item.id, item.revision, course.circuit, hash) as CircuitRow | undefined;
    if (existing && reusable(existing)) return { id: existing.id, created: false };
    if (existing) db.prepare("DELETE FROM circuits WHERE id = ?").run(existing.id);
    const id = randomUUID();
    db.prepare(
      `INSERT INTO circuits (id, course_id, item_id, revision, runner, source_hash, state, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`,
    ).run(id, course.id, item.id, item.revision, course.circuit, hash, new Date().toISOString());
    pruneCircuits(db, course.id, item.id);
    return { id, created: true };
  });
  if (created) await trackSubmission(id, () => submitCircuit(db, client, id, request.data));
  const row = selectCircuit(db, id);
  if (!row) throw new Error(`Circuit ${id} was deleted while it was being started.`);
  return toRecord(row);
}

/** Reads a circuit, asking the runner about it when it is not terminal. Undefined when there is no such circuit. */
export async function readCircuit(
  id: string,
  options: { waitMs?: number; signal?: AbortSignal } = {},
): Promise<CircuitRecord | undefined> {
  const db = database();
  let row = selectCircuit(db, id);
  if (row && !isTerminal(row.state) && row.job_id === null && (await awaitSubmission(id))) row = selectCircuit(db, id);
  if (!row) return undefined;
  if (isTerminal(row.state)) return toRecord(row);
  if (row.job_id === null) {
    const settled = settleCircuit(db, id, failed(unavailable("The circuit was never handed to the runner.")));
    return settled && toRecord(settled);
  }
  let observation: Observation;
  try {
    observation = await observeJob(row.job_id, {
      waitMs: options.waitMs ?? 0,
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (error) {
    if (isAbort(error, options.signal)) return toRecord(selectCircuit(db, id) ?? row);
    throw error;
  }
  const updated = applyObservation(db, id, observation);
  return updated && toRecord(updated);
}
