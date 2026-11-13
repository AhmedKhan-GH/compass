/**
 * The SQLite store at `<dataDirectory()>/compass.db`: runs, circuits and item state for the one local learner.
 * Records are keyed by course id and item id (the UUID), never by slug alone.
 *
 * One handle per process is kept on globalThis, because Next's dev server reloads modules.
 * Every call on the handle is synchronous: never await inside a transaction.
 */
import Database from "better-sqlite3";
import { chmodSync, mkdirSync } from "node:fs";
import path from "node:path";
import { dataDirectory } from "./paths.ts";

export type Db = Database.Database;

export const DATABASE_FILENAME = "compass.db";

/**
 * Forward migrations: entry `n` takes the schema from version `n` to version `n + 1`.
 * Never edit a released entry; append a new one.
 */
export const MIGRATIONS: readonly string[] = [
  `
  CREATE TABLE runs (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    course_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_slug TEXT NOT NULL,
    revision TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('test', 'submission')),
    task_id INTEGER,
    tasks_json TEXT NOT NULL CHECK (json_valid(tasks_json)),
    files_json TEXT NOT NULL CHECK (json_valid(files_json)),
    job_id TEXT,
    state TEXT NOT NULL CHECK (state IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
    position INTEGER,
    created_at TEXT NOT NULL,
    finished_at TEXT,
    duration_ms INTEGER,
    report_json TEXT CHECK (report_json IS NULL OR json_valid(report_json)),
    log TEXT,
    waveform TEXT,
    error_json TEXT CHECK (error_json IS NULL OR json_valid(error_json)),
    image_id TEXT,
    task_status_json TEXT CHECK (task_status_json IS NULL OR json_valid(task_status_json))
  );
  CREATE INDEX runs_by_item ON runs (course_id, item_id, seq DESC);

  CREATE TABLE circuits (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT NOT NULL UNIQUE,
    course_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    revision TEXT NOT NULL,
    runner TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    job_id TEXT,
    state TEXT NOT NULL CHECK (state IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
    created_at TEXT NOT NULL,
    finished_at TEXT,
    circuit_json TEXT CHECK (circuit_json IS NULL OR json_valid(circuit_json)),
    ports_json TEXT CHECK (ports_json IS NULL OR json_valid(ports_json)),
    warnings TEXT,
    error_json TEXT CHECK (error_json IS NULL OR json_valid(error_json)),
    image_id TEXT,
    UNIQUE (course_id, item_id, revision, runner, source_hash)
  );
  CREATE INDEX circuits_by_item ON circuits (course_id, item_id, seq DESC);

  -- The reset marker: runs with seq <= reset_seq were made before the last reset and do not count.
  CREATE TABLE item_state (
    course_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    reset_seq INTEGER NOT NULL DEFAULT 0,
    reset_at TEXT,
    PRIMARY KEY (course_id, item_id)
  );

  -- The first passing submission of each revision. A reset deletes the item's rows.
  CREATE TABLE completions (
    course_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    revision TEXT NOT NULL,
    run_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (course_id, item_id, revision)
  );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

function userVersion(db: Db): number {
  return db.pragma("user_version", { simple: true }) as number;
}

/** Brings the schema up to SCHEMA_VERSION, one migration per transaction. */
export function migrate(db: Db): void {
  if (userVersion(db) > SCHEMA_VERSION)
    throw new Error(
      `The store at ${db.name} has schema version ${userVersion(db)}; this app knows up to ${SCHEMA_VERSION}.`,
    );
  while (userVersion(db) < SCHEMA_VERSION) {
    db.transaction(() => {
      // Another process may have applied this migration while this one waited for the lock.
      const version = userVersion(db);
      const migration = MIGRATIONS[version];
      if (migration === undefined) return;
      db.exec(migration);
      db.pragma(`user_version = ${version + 1}`);
    }).immediate();
  }
}

/** Opens (and creates, the first time) the store at `file`, in WAL mode, with the schema up to date. */
export function openDatabase(file: string): Db {
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const db = new Database(file, { timeout: 5000 });
  try {
    chmodSync(file, 0o600);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = FULL");
    db.pragma("foreign_keys = ON");
    migrate(db);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function databasePath(): string {
  return path.join(dataDirectory(), DATABASE_FILENAME);
}

const held = globalThis as typeof globalThis & { compassDatabase?: { file: string; db: Db } };

/** The process's handle on the store. It reopens when COMPASS_DATA_DIR points somewhere else. */
export function database(): Db {
  const file = databasePath();
  const current = held.compassDatabase;
  if (current && current.file === file && current.db.open) return current.db;
  if (current?.db.open) current.db.close();
  const db = openDatabase(file);
  held.compassDatabase = { file, db };
  return db;
}

/** Closes the process's handle. For tests. */
export function closeDatabase(): void {
  const current = held.compassDatabase;
  if (current?.db.open) current.db.close();
  held.compassDatabase = undefined;
}

/** Runs `operation` in a write transaction that takes the lock at once, so readers in other processes never deadlock. */
export function writeTransaction<T>(db: Db, operation: () => T): T {
  return db.transaction(operation).immediate();
}
