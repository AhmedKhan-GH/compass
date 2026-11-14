/** The index compiler: schema, determinism, revisions and what the index must never hold. */
import assert from "node:assert/strict";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { ContentIndex, toItemView } from "@compass/schema";
import { compileIndex, itemRevision, serializeIndex, writeIndex } from "../src/compile.ts";
import { loadPack } from "../src/loader.ts";
import { FIXTURE_PACK, load, temporaryDirectory, temporaryPack } from "./helpers.ts";

async function compileAt(directory: string) {
  return compileIndex([await loadPack({ directory, label: "verilog", source: "local:verilog" })]);
}

test("the index matches the schema and carries the course, concepts and items", async () => {
  const index = await compileAt(FIXTURE_PACK);
  assert.equal(ContentIndex.safeParse(index).success, true);
  const course = index.courses[0];
  assert.ok(course);
  assert.equal(course.id, "fixture/verilog");
  assert.equal(course.namespace, "fixture");
  assert.equal(course.name, "verilog");
  assert.equal(course.source, "local:verilog");
  assert.equal(course.circuit, "yosys-digitaljs@1");
  assert.deepEqual(course.editor, { indent: 4 });
  assert.ok(course.syllabus?.startsWith("# Fixture course"));
  assert.deepEqual(
    course.concepts.map((concept) => [concept.slug, concept.name, Boolean(concept.introduction), Boolean(concept.about)]),
    [["constants", "Constants", true, true]],
  );
  const [drive, bank] = course.items;
  assert.ok(drive && bank);
  assert.equal(drive.id, "9a2fa263-5ac6-47ef-9388-b845860ca190");
  assert.equal(drive.slug, "drive-high");
  assert.match(drive.revision, /^[0-9a-f]{64}$/);
  assert.ok(drive.instructions.startsWith("Before a museum exhibit opens"));
  assert.ok(!drive.instructions.includes("## 1."));
  assert.equal(drive.hints, undefined);
  assert.deepEqual(
    drive.tasks.map((task) => [task.id, task.title, task.tests, Boolean(task.hints)]),
    [
      [1, "Give the model an output", ["output_port_is_one_bit"], true],
      [2, "Light the indicator", ["output_is_high", "output_stays_high"], true],
    ],
  );
  assert.ok(drive.tasks[1]?.instructions.startsWith("The staff switch on the exhibit"));
  assert.deepEqual(drive.design, { top: "top_module", solution: "top_module.v", support: [], editable: [], schematic: true });
  assert.deepEqual(Object.keys(drive.starter), ["top_module.v"]);
  assert.equal(drive.checks.name, "test_output.py");
  assert.ok(drive.checks.content.includes("async def output_is_high"));
  // No [[task]]: one implicit task titled after the item, with no text or tests of its own.
  assert.deepEqual(bank.tasks, [{ id: 1, title: "Light Bank", instructions: "", tests: [], implicit: true }]);
  assert.ok(bank.instructions.startsWith("A display bank holds two lamps"));
  assert.equal(bank.instructions, (await readFile(path.join(FIXTURE_PACK, "items/light-bank/instructions.md"), "utf8")).trim());
  assert.ok(!bank.instructions.includes("## 1."));
  assert.equal(drive.tasks.some((task) => task.implicit), false);
  assert.deepEqual(bank.prerequisites, ["constants"]);
  assert.equal(bank.difficulty, 2);
  assert.ok(bank.hints?.startsWith("An instance names the module"));
  assert.deepEqual(Object.keys(bank.starter), ["lamp.v", "top_module.v"]);
  assert.ok(bank.starter["lamp.v"]?.includes("assign on = 1'b0;"), "the starter keeps the starter support file");
  assert.equal("checks" in toItemView(drive), false);
});

test("the index holds no reference, wrong solution, stage or notes text", async () => {
  const text = serializeIndex(await compileAt(FIXTURE_PACK));
  for (const marker of ["REFERENCE-ONLY-MARKER", "WRONG-ONLY-MARKER", "STAGE-ONLY-MARKER", "NOTES-ONLY-MARKER"])
    assert.equal(text.includes(marker), false, marker);
  for (const name of ["exemplar.v", "low.v", "task_1.v", "example.v", "one_lamp.v", "notes.md"])
    assert.equal(text.includes(name), false, name);
});

test("the same packs give the same bytes, wherever they are", async (t) => {
  const first = serializeIndex(await compileAt(FIXTURE_PACK));
  const second = serializeIndex(await compileAt(FIXTURE_PACK));
  const copy = await temporaryPack(t);
  const third = serializeIndex(await compileAt(copy));
  assert.equal(first, second);
  assert.equal(first, third);
  assert.ok(first.endsWith("}\n"));
  assert.equal(/\d{4}-\d{2}-\d{2}T\d{2}:/.test(first), false, "no timestamps");
  const parsed = JSON.parse(first) as { courses: Record<string, unknown>[] };
  assert.deepEqual(Object.keys(parsed).slice(0, 2), ["schema", "courses"]);
  assert.deepEqual(Object.keys(parsed.courses[0] ?? {}).slice(0, 4), ["id", "namespace", "name", "version"]);
});

test("courses are ordered by id, whatever the order of the packs", async (t) => {
  const copy = await temporaryPack(t);
  const course = path.join(copy, "course.toml");
  await writeFile(course, (await readFile(course, "utf8")).replace('id = "fixture/verilog"', 'id = "alpha/verilog"'));
  const fixture = await load(FIXTURE_PACK);
  const alpha = await loadPack({ directory: copy, label: "alpha", source: "local:alpha" });
  const forward = serializeIndex(compileIndex([fixture, alpha]));
  const backward = serializeIndex(compileIndex([alpha, fixture]));
  assert.equal(forward, backward);
  assert.deepEqual(
    compileIndex([fixture, alpha]).courses.map((c) => c.id),
    ["alpha/verilog", "fixture/verilog"],
  );
});

test("the revision follows what a run uses or the learner reads, and nothing else", async (t) => {
  const pack = await temporaryPack(t);
  const revision = async () => (await compileAt(pack)).courses[0]?.items[0]?.revision;
  const original = await revision();
  const edit = async (relative: string, change: (text: string) => string) => {
    const file = path.join(pack, relative);
    await writeFile(file, change(await readFile(file, "utf8")));
  };
  await edit("items/drive-high/notes.md", (text) => `${text}\nMore notes.\n`);
  await edit("items/drive-high/reference/exemplar.v", (text) => `${text}// changed\n`);
  await edit("items/drive-high/wrong/low.v", (text) => `${text}// changed\n`);
  await edit("items/drive-high/stages/task_1.v", (text) => `${text}// changed\n`);
  await edit("course.toml", (text) => text.replace('title = "Fixture course"', 'title = "Renamed course"'));
  assert.equal(await revision(), original, "notes, references, wrong solutions, stages and the course title do not count");
  for (const [relative, change] of [
    ["items/drive-high/instructions.md", (text: string) => text.replace("museum", "gallery")],
    ["items/drive-high/hints.md", (text: string) => `${text}\nOne more hint.\n`],
    ["items/drive-high/starter/top_module.v", (text: string) => `// header\n${text}`],
    ["items/drive-high/checks/test_output.py", (text: string) => `${text}\n# comment\n`],
    ["items/drive-high/item.toml", (text: string) => text.replace('title = "First Light"', 'title = "First Lamp"')],
    ["course.toml", (text: string) => text.replace('runner = "iverilog-cocotb@1"', 'runner = "iverilog-cocotb@2"')],
  ] as const) {
    const before = await revision();
    await edit(relative, change);
    assert.notEqual(await revision(), before, relative);
  }
});

test("the implicit task leaves the revision as it was: it is computed from the manifest's task map", async (t) => {
  const index = await compileAt(FIXTURE_PACK);
  const [drive, bank] = index.courses[0]?.items ?? [];
  // The revisions the compiler gave before items without [[task]] had an implicit task.
  assert.equal(drive?.revision, "123e719ba3b4945fefac0ecaed6f74bc9a46c9f00ad2c6b0f5594bb824e8030b");
  assert.equal(bank?.revision, "ceb8d61804c87ce98750d67e546ad271bcbbf322b8382ba46ac1afd054bf8ec3");
  assert.equal(bank?.tasks[0]?.implicit, true);
  const pack = await load(FIXTURE_PACK);
  const item = pack.items.find((candidate) => candidate.slug === "light-bank");
  assert.ok(item?.manifest && pack.manifest);
  assert.equal(item.manifest.task, undefined, "the pack declares no task");
  assert.equal(itemRevision(pack.manifest, item), bank?.revision);

  // The implicit task is titled after the item, so a new title changes the revision as it always did.
  const copy = await temporaryPack(t);
  const manifest = path.join(copy, "items/light-bank/item.toml");
  await writeFile(manifest, (await readFile(manifest, "utf8")).replace('title = "Light Bank"', 'title = "Lamp Bank"'));
  const renamed = (await compileAt(copy)).courses[0]?.items[1];
  assert.equal(renamed?.tasks[0]?.title, "Lamp Bank");
  assert.notEqual(renamed?.revision, bank?.revision);
});

test("the index is written atomically, leaving no temporary file", async (t) => {
  const directory = await temporaryDirectory(t);
  const target = path.join(directory, "nested", "content-index.json");
  const index = await compileAt(FIXTURE_PACK);
  await writeIndex(target, index);
  await writeIndex(target, index);
  assert.equal(await readFile(target, "utf8"), serializeIndex(index));
  assert.deepEqual(await readdir(path.dirname(target)), ["content-index.json"]);
});
