/** Courses in development: the plan rules, the compiled plan, and nothing to run. */
import assert from "node:assert/strict";
import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { main } from "../src/cli.ts";
import { compileIndex } from "../src/compile.ts";
import { planRuns } from "../src/dynamic.ts";
import { loadPack } from "../src/loader.ts";
import { FIXTURES, capture, check, editToml, fakeRunner, messages, temporaryDirectory, temporaryPack } from "./helpers.ts";

const PLAN_PACK = path.join(FIXTURES, "plan");

type Table = Record<string, unknown>;

async function temporaryPlan(t: { after: (fn: () => Promise<void>) => void }): Promise<string> {
  const directory = path.join(await temporaryDirectory(t), "plan");
  await cp(PLAN_PACK, directory, { recursive: true });
  return directory;
}

const course = (pack: string, update: (value: Table) => void) => editToml(path.join(pack, "course.toml"), update);

test("the planned fixture passes the static checks with no items folder", async () => {
  assert.deepEqual(await check(PLAN_PACK), []);
});

test("a course in development has no [[item]] and no items/ folder", async (t) => {
  const pack = await temporaryPlan(t);
  await course(pack, (value) => {
    value.item = [{ slug: "drive-high", prerequisites: [] }];
  });
  await mkdir(path.join(pack, "items/drive-high"), { recursive: true });
  const diagnostics = await check(pack);
  assert.deepEqual(messages(diagnostics, "plan"), [
    "error: a course in development has no [[item]]; this one lists 1",
    "error: a course in development has no items/ folder",
    "error: the planned exercise drive-high is also an item",
  ]);
  assert.deepEqual(messages(diagnostics, "files"), [], "the items of a plan are not read");
});

test("a course in development may name kinds, which must still be known", async (t) => {
  const pack = await temporaryPlan(t);
  await course(pack, (value) => {
    value.environment = "code@7";
    value.runner = "iverilog-cocotb@1";
  });
  assert.deepEqual(messages(await check(pack), "kinds"), [
    "error: environment code@7 is not known; known: code@1",
    "error: runner iverilog-cocotb@1 does not accept the language systemverilog",
  ]);
});

test("a draft or published course needs an environment, a runner and an item", async (t) => {
  const pack = await temporaryPack(t);
  await course(pack, (value) => {
    delete value.environment;
    delete value.runner;
  });
  assert.deepEqual(messages(await check(pack), "kinds"), [
    "error: environment is required for a published course; known: code@1",
    "error: runner is required for a published course; known test runners: iverilog-cocotb@1",
  ]);
  const plan = await temporaryPlan(t);
  await course(plan, (value) => {
    value.status = "draft";
    value.environment = "code@1";
    value.runner = "iverilog-cocotb@1";
    value.language = "verilog";
  });
  assert.deepEqual(messages(await check(plan), "plan"), [
    "error: a draft course lists at least one [[item]]; only a course in development has none",
  ]);
});

test("stage ids and planned slugs are unique; a planned stage is declared; a planned slug is not an item", async (t) => {
  const pack = await temporaryPlan(t);
  await course(pack, (value) => {
    const stages = value.stage as Table[];
    const planned = value.planned as Table[];
    stages.push({ id: "state", name: "State again" });
    planned.push({ slug: "count-visitors", title: "Again", blurb: "Twice.", kind: "practice" });
    planned.push({ slug: "timers", title: "Timers", blurb: "Time things.", kind: "concept", stage: "clocks" });
  });
  assert.deepEqual(messages(await check(pack), "plan"), [
    "error: the stage state is declared more than once",
    "error: the planned exercise count-visitors is listed more than once",
    "error: the planned exercise timers names the stage clocks, which is not declared",
  ]);
  const draft = await temporaryPack(t);
  await course(draft, (value) => {
    value.planned = [{ slug: "light-bank", title: "Light Bank", blurb: "Already written.", kind: "practice" }];
  });
  assert.deepEqual(messages(await check(draft), "plan"), ["error: the planned exercise light-bank is also an item"]);
});

test("the index carries the plan: description, stages and planned exercises in order, no runner", async () => {
  const pack = await loadPack({ directory: PLAN_PACK, label: "plan", source: "local:plan" });
  const course = compileIndex([pack]).courses[0];
  assert.ok(course);
  assert.equal(course.status, "in-development");
  assert.equal(course.description, "Two stages of planned exercises. None of them can be opened or run yet.");
  assert.equal("environment" in course, false);
  assert.equal("runner" in course, false);
  assert.deepEqual(course.items, []);
  assert.deepEqual(course.stages, [
    { id: "first-signals", name: "First signals" },
    { id: "state", name: "State" },
  ]);
  assert.deepEqual(course.planned, [
    {
      slug: "drive-high",
      title: "First Light",
      blurb: "Give a museum exhibit its first always-on power indicator.",
      kind: "concept",
      stage: "first-signals",
    },
    { slug: "count-visitors", title: "Visitor Counter", blurb: "Count the visitors who pass a gate.", kind: "practice", stage: "state" },
    { slug: "later-idea", title: "Later", blurb: "An exercise without a stage yet.", kind: "practice" },
  ]);
  assert.deepEqual(Object.keys(course).slice(-3), ["items", "stages", "planned"]);
});

test("a course in development has nothing to run, and says so", async (t) => {
  const pack = await loadPack({ directory: PLAN_PACK, label: "plan", source: "local:plan" });
  assert.deepEqual(planRuns(pack, pack.items), { runs: [], diagnostics: [] });

  const cwd = await temporaryDirectory(t);
  const client = fakeRunner();
  const stdout = capture();
  const code = await main(["content", "check", "--source", FIXTURES], {
    cwd,
    env: {},
    stdout,
    stderr: capture(),
    createRunner: () => client,
  });
  assert.equal(code, 0, stdout.text());
  assert.match(stdout.text(), /^fixture\/plan {2}\S+ {2}ok {2}\(in development, 3 planned\)$/m);
  assert.match(stdout.text(), /^ {2}drive-high {2}ok {2}\(4 runs\)$/m);
  assert.equal(client.requests.length, 6, "only the verilog fixture's runs");

  const alone = capture();
  const unreachable = fakeRunner(undefined, { unreachable: true });
  const planOnly = await main(["content", "check", "--source", FIXTURES, "fixture/plan"], {
    cwd,
    env: {},
    stdout: alone,
    stderr: capture(),
    createRunner: () => unreachable,
  });
  assert.equal(planOnly, 0, "a plan needs no runner");
  assert.match(alone.text(), /^fixture\/plan {2}\S+ {2}ok {2}\(in development, 3 planned\)\nChecked 1 pack and 0 items: no errors\.\n$/);
});

test("list shows the planned count", async (t) => {
  const root = await temporaryDirectory(t);
  await cp(PLAN_PACK, path.join(root, "packs/plan"), { recursive: true });
  await cp(path.join(FIXTURES, "verilog"), path.join(root, "packs/verilog"), { recursive: true });
  await rm(path.join(root, "packs/verilog/items/light-bank"), { recursive: true });
  await editToml(path.join(root, "packs/verilog/course.toml"), (value) => {
    value.item = (value.item as Table[]).slice(0, 1);
    value.planned = [{ slug: "light-bank", title: "Light Bank", blurb: "Next.", kind: "practice" }];
  });
  await writeFile(path.join(root, "compass.config.toml"), '[[content.source]]\nkind = "local"\npath = "packs"\n');
  const stdout = capture();
  assert.equal(await main(["content", "list"], { cwd: root, env: {}, stdout, stderr: capture() }), 0);
  assert.deepEqual(stdout.text().trimEnd().split("\n"), [
    "fixture/plan  Planned fixture course  (0.1.0, in-development, 0 items, 3 planned, packs/plan)",
    "fixture/verilog  Fixture course  (0.1.0, published, 1 item, 1 planned, packs/verilog)",
    "  1  drive-high  concept   First Light",
  ]);
});
