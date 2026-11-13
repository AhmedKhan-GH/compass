/** The static rules: the fixture passes them all; a small variation of it fails each one. */
import assert from "node:assert/strict";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { checkAcrossPacks, checkPack } from "../src/checks.ts";
import { loadPack } from "../src/loader.ts";
import { FIXTURE_PACK, check, editToml, messages, temporaryPack } from "./helpers.ts";

type Table = Record<string, unknown>;
const course = (pack: string, update: (value: Table) => void) => editToml(path.join(pack, "course.toml"), update);
const item = (pack: string, slug: string, update: (value: Table) => void) =>
  editToml(path.join(pack, "items", slug, "item.toml"), update);
const items = (value: Table) => value.item as Table[];
const tasks = (value: Table) => value.task as Table[];

test("the fixture passes every static rule", async () => {
  assert.deepEqual(await check(FIXTURE_PACK), []);
});

test("ids: item slugs, concept slugs and item ids are unique", async (t) => {
  const pack = await temporaryPack(t);
  await course(pack, (value) => {
    items(value).push({ slug: "drive-high", prerequisites: [] });
    (value.concept as Table[]).push({ slug: "constants", name: "Again" });
  });
  await item(pack, "light-bank", (value) => {
    value.id = "9a2fa263-5ac6-47ef-9388-b845860ca190";
  });
  assert.deepEqual(messages(await check(pack), "ids"), [
    "error: the item drive-high is listed more than once",
    "error: the concept constants is declared more than once",
    "error: the item id 9a2fa263-5ac6-47ef-9388-b845860ca190 is also the id of drive-high",
  ]);
});

test("ids: a course id names one pack", async (t) => {
  const pack = await temporaryPack(t);
  const twin = path.join(path.dirname(pack), "twin");
  await cp(pack, twin, { recursive: true });
  const packs = [
    await loadPack({ directory: pack, label: "packs/verilog", source: "local:packs/verilog" }),
    await loadPack({ directory: twin, label: "packs/twin", source: "local:packs/twin" }),
  ];
  assert.deepEqual(
    checkAcrossPacks(packs).map((d) => [d.pack, d.message]),
    [
      ["packs/verilog", "the course id fixture/verilog is also used by packs/twin"],
      ["packs/twin", "the course id fixture/verilog is also used by packs/verilog"],
    ],
  );
});

test("kinds: the environment, runner and circuit are known kinds of the right purpose", async (t) => {
  const pack = await temporaryPack(t);
  await course(pack, (value) => {
    value.environment = "code@9";
    value.runner = "yosys-digitaljs@1";
    value.circuit = "iverilog-cocotb@1";
  });
  assert.deepEqual(messages(await check(pack), "kinds"), [
    "error: environment code@9 is not known; known: code@1",
    "error: runner yosys-digitaljs@1 is a circuit runner, not a test runner",
    "error: circuit iverilog-cocotb@1 is a test runner, not a circuit runner",
  ]);
  await course(pack, (value) => {
    value.environment = "code@1";
    value.runner = "verilator@1";
    value.circuit = "yosys-digitaljs@1";
    value.language = "vhdl";
  });
  assert.deepEqual(messages(await check(pack), "kinds"), [
    "error: runner verilator@1 is not known; known test runners: iverilog-cocotb@1",
    "error: circuit yosys-digitaljs@1 does not accept the language vhdl",
  ]);
});

test("design: file roles are distinct and fit in one job", async (t) => {
  const pack = await temporaryPack(t);
  await item(pack, "light-bank", (value) => {
    const design = value.design as Table;
    design.support = ["lamp.v", "top_module.v", "test_bank.py"];
    design.editable = ["lamp.v", "extra.v"];
  });
  const found = messages(await check(pack), "design");
  assert.deepEqual(found, [
    "error: design.support lists the solution file top_module.v",
    "error: design.editable lists extra.v, which is not in design.support",
    "error: the checks file test_bank.py has the same name as a starter file",
  ]);
  await item(pack, "light-bank", (value) => {
    const design = value.design as Table;
    design.support = Array.from({ length: 16 }, (_, index) => `part_${index}.v`);
    design.editable = [];
  });
  for (let index = 0; index < 16; index++)
    await writeFile(path.join(pack, `items/light-bank/starter/part_${index}.v`), "module part; endmodule\n");
  assert.deepEqual(messages(await check(pack), "design"), [
    "error: the item has 17 starter files; a run carries at most 16",
  ]);
});

test("files: editable support files need a reference of the same name", async (t) => {
  const pack = await temporaryPack(t);
  await rm(path.join(pack, "items/light-bank/reference/lamp.v"));
  assert.deepEqual(messages(await check(pack), "files"), [
    "error: design.editable names reference/lamp.v, which does not exist",
  ]);
});

test("concepts: named concepts are declared; concept folders have both pages", async (t) => {
  const pack = await temporaryPack(t);
  await item(pack, "light-bank", (value) => {
    value.concepts = ["constants", "wires"];
  });
  await rm(path.join(pack, "concepts/constants/about.md"));
  await mkdir(path.join(pack, "concepts/stray"));
  await course(pack, (value) => {
    (value.concept as Table[]).push({ slug: "vectors", name: "Vectors" });
  });
  assert.deepEqual(messages(await check(pack), "concepts"), [
    "error: the concept wires is not declared in course.toml",
    "error: the concept constants has a folder but no about.md",
    "warning: concepts/stray is not a concept declared in course.toml",
    "warning: the concept vectors is declared but no concept item teaches it",
  ]);
});

test("prerequisites: declared, and taught by an earlier concept item", async (t) => {
  const pack = await temporaryPack(t);
  await course(pack, (value) => {
    items(value)[0] = { slug: "drive-high", prerequisites: ["constants", "timing"] };
  });
  assert.deepEqual(messages(await check(pack), "prerequisites"), [
    "error: the item drive-high requires constants, which no concept item before it teaches",
    "error: the item drive-high requires timing, which is not a declared concept",
  ]);
});

test("prerequisites: in a draft pack a prerequisite not yet taught is a warning", async (t) => {
  const pack = await temporaryPack(t);
  await course(pack, (value) => {
    value.status = "draft";
    items(value).reverse();
  });
  const diagnostics = await check(pack);
  assert.deepEqual(messages(diagnostics, "prerequisites"), [
    "warning: the item light-bank requires constants, which no concept item before it teaches",
  ]);
  assert.equal(diagnostics.filter((d) => d.severity === "error").length, 0);
});

test("tasks: headings match the task ids, which run from 1", async (t) => {
  const pack = await temporaryPack(t);
  const instructions = path.join(pack, "items/drive-high/instructions.md");
  await writeFile(instructions, (await readFile(instructions, "utf8")).replace("## 2. Light", "## 3. Light"));
  await item(pack, "drive-high", (value) => {
    const list = tasks(value);
    if (list[1]) list[1].id = 3;
  });
  assert.deepEqual(messages(await check(pack), "tasks"), [
    "error: task ids must run 1, 2, 3 in order; task 2 has the id 3",
    "error: the hint heading ## 2. (line 5) names no task",
  ]);
  await item(pack, "drive-high", (value) => {
    const list = tasks(value);
    if (list[1]) list[1].id = 2;
  });
  assert.deepEqual(messages(await check(pack), "tasks"), [
    "error: the task headings are ## 1., ## 3.; item.toml declares tasks 1, 2",
  ]);
});

test("tasks: an item without tasks has no task headings; a heading needs text", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(path.join(pack, "items/light-bank/instructions.md"), "Intro\n\n## 1. Only\nText\n");
  await writeFile(path.join(pack, "items/drive-high/instructions.md"), "## 1. One\nText\n## 2. Two\n");
  assert.deepEqual(messages(await check(pack), "tasks"), [
    "error: task 2 (line 3) has a heading but no text",
    "error: instructions.md has task headings (## 1. …) but item.toml has no [[task]]",
  ]);
});

test("tasks: hint headings name existing tasks, once each", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(path.join(pack, "items/drive-high/hints.md"), "General.\n## 1. A\nx\n## 1. Again\ny\n## 4. Missing\nz\n");
  assert.deepEqual(messages(await check(pack), "tasks"), [
    "error: the hints for task 1 appear more than once (line 4)",
    "error: the hint heading ## 4. (line 6) names no task",
  ]);
});

test("tasks: every test is mapped to exactly one task, and every mapped test exists", async (t) => {
  const pack = await temporaryPack(t);
  await item(pack, "drive-high", (value) => {
    const list = tasks(value);
    if (list[0]) list[0].tests = ["output_port_is_one_bit", "output_is_high", "no_such_test"];
    if (list[1]) list[1].tests = ["output_is_high"];
  });
  assert.deepEqual(messages(await check(pack), "tasks"), [
    "error: the test output_is_high is mapped more than once (tasks 1, 2)",
    "error: task 1 names the test no_such_test, which test_output.py does not define",
    "error: the test output_stays_high (line 30) is not mapped to a task",
  ]);
});

test("tasks: the checks file defines tests the way cocotb registers them", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(
    path.join(pack, "items/light-bank/checks/test_bank.py"),
    "import cocotb\n\n@cocotb.test()\ndef sync_test(dut):\n    pass\n",
  );
  const checks = path.join(pack, "items/drive-high/checks/test_output.py");
  await writeFile(checks, `${await readFile(checks, "utf8")}\n\n@cocotb.test()\nasync def output_is_high(dut):\n    pass\n`);
  assert.deepEqual(messages(await check(pack), "tasks"), [
    "error: the test output_is_high is defined twice (lines 21 and 40)",
    "error: the test sync_test on line 4 must be an async def",
    "error: the checks file defines no test (an async def under @cocotb.test())",
  ]);
});

test("links: relative links in Markdown resolve inside the pack", async (t) => {
  const pack = await temporaryPack(t);
  await writeFile(
    path.join(pack, "items/drive-high/hints.md"),
    [
      "## 1. A",
      "See [the intro](intro.md#name), [the course](../../course.toml) and [the web](https://example.org/x.md).",
      "Broken: [gone](missing.md) and [outside](../../../elsewhere.md) and ![image](<figures/a b.png>).",
      "Code is not a link: `[x](nowhere.md)`",
      "```",
      "[y](nowhere-either.md)",
      "```",
      "[ref]: ./also-missing.md",
      "## 2. B",
      '<img src="images/lamp.png"> and [anchor](#top) and [site](/courses).',
    ].join("\n"),
  );
  assert.deepEqual(messages(await check(pack), "links"), [
    "error: the link missing.md (line 3) points to items/drive-high/missing.md, which the pack does not have",
    "error: the link ../../../elsewhere.md (line 3) leaves the pack",
    "error: the link figures/a b.png (line 3) points to items/drive-high/figures/a b.png, which the pack does not have",
    "error: the link ./also-missing.md (line 8) points to items/drive-high/also-missing.md, which the pack does not have",
    "error: the link images/lamp.png (line 10) points to items/drive-high/images/lamp.png, which the pack does not have",
  ]);
});

test("every static diagnostic carries its pack, item and file", async (t) => {
  const pack = await temporaryPack(t);
  await item(pack, "light-bank", (value) => {
    value.concepts = ["wires"];
  });
  const diagnostics = await checkPack(await loadPack({ directory: pack, label: "packs/verilog", source: "local:packs/verilog" }));
  const concept = diagnostics.find((d) => d.rule === "concepts" && d.severity === "error");
  assert.deepEqual(concept && { pack: concept.pack, item: concept.item, file: concept.file }, {
    pack: "packs/verilog",
    item: "light-bank",
    file: "items/light-bank/item.toml",
  });
});
