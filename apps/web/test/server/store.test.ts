import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import Database from "better-sqlite3";
import { DEFAULT_RUNNER_URL } from "@compass/schema";
import {
  DATABASE_FILENAME,
  SCHEMA_VERSION,
  closeDatabase,
  database,
  migrate,
  openDatabase,
} from "../../src/server/db.ts";
import { resolveRunnerUrl } from "../../src/server/runner.ts";

const scratch = mkdtempSync(path.join(tmpdir(), "compass-store-test-"));
test.after(() => {
  closeDatabase();
  rmSync(scratch, { recursive: true, force: true });
});

test("the store is created on first use, in WAL mode, at the current schema version", () => {
  const directory = path.join(scratch, "first");
  process.env.COMPASS_DATA_DIR = directory;
  const db = database();
  const file = path.join(directory, DATABASE_FILENAME);
  assert.equal(db.name, file);
  assert.equal(db.pragma("journal_mode", { simple: true }), "wal");
  assert.equal(db.pragma("user_version", { simple: true }), SCHEMA_VERSION);
  assert.ok(SCHEMA_VERSION >= 1);
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[])
    .map((row) => row.name)
    .filter((name) => !name.startsWith("sqlite_"));
  assert.deepEqual(tables, ["circuits", "completions", "item_state", "runs"]);
  assert.equal(statSync(file).mode & 0o777, 0o600);
  // One handle per process while the directory stays the same.
  assert.equal(database(), db);
});

test("the handle reopens when the data directory changes, and survives a closed handle", () => {
  process.env.COMPASS_DATA_DIR = path.join(scratch, "a");
  const a = database();
  process.env.COMPASS_DATA_DIR = path.join(scratch, "b");
  const b = database();
  assert.notEqual(a, b);
  assert.equal(a.open, false);
  b.close();
  const reopened = database();
  assert.equal(reopened.open, true);
  assert.equal(reopened.name, path.join(scratch, "b", DATABASE_FILENAME));
});

test("migrations run forward from an empty file, are idempotent, and keep data", () => {
  const file = path.join(scratch, "migrate", DATABASE_FILENAME);
  mkdirSync(path.dirname(file), { recursive: true });
  const raw = new Database(file);
  assert.equal(raw.pragma("user_version", { simple: true }), 0);
  raw.close();
  const db = openDatabase(file);
  db.prepare("INSERT INTO item_state (course_id, item_id, reset_seq) VALUES ('a/b', 'x', 3)").run();
  migrate(db);
  db.close();
  const again = openDatabase(file);
  assert.equal(again.pragma("user_version", { simple: true }), SCHEMA_VERSION);
  assert.deepEqual(again.prepare("SELECT reset_seq FROM item_state").get(), { reset_seq: 3 });
  again.close();
});

test("a store from a newer app version is refused", () => {
  const file = path.join(scratch, "newer", DATABASE_FILENAME);
  mkdirSync(path.dirname(file), { recursive: true });
  const raw = new Database(file);
  raw.pragma(`user_version = ${SCHEMA_VERSION + 1}`);
  raw.close();
  assert.throws(() => openDatabase(file), /schema version/);
});

test("the runner address comes from the environment, then the config file, then the default", () => {
  const config = path.join(scratch, "compass.config.toml");
  writeFileSync(
    config,
    '[[content.source]]\nkind = "local"\npath = "content"\n\n[runner]\nurl = "http://127.0.0.1:4555"\n',
  );
  assert.equal(resolveRunnerUrl("http://127.0.0.1:9999", config), "http://127.0.0.1:9999");
  assert.equal(resolveRunnerUrl(undefined, config), "http://127.0.0.1:4555");
  assert.equal(resolveRunnerUrl("", config), "http://127.0.0.1:4555");
  assert.equal(resolveRunnerUrl(undefined, path.join(scratch, "missing.toml")), DEFAULT_RUNNER_URL);
  const noRunner = path.join(scratch, "no-runner.toml");
  writeFileSync(noRunner, '[[content.source]]\nkind = "local"\npath = "content"\n');
  assert.equal(resolveRunnerUrl(undefined, noRunner), DEFAULT_RUNNER_URL);
  const invalid = path.join(scratch, "invalid.toml");
  writeFileSync(invalid, '[runner]\nurl = "not a url"\n');
  assert.throws(() => resolveRunnerUrl(undefined, invalid), /not a valid Compass configuration/);
});
