import assert from "node:assert/strict";
import test from "node:test";
import { checkPack } from "../src/checks.ts";
import { compileItem, itemRevision } from "../src/compile.ts";
import { buildTestJob } from "../src/dynamic.ts";
import { findNativeTests } from "../src/python.ts";
import { FIXTURE_PACK, load } from "./helpers.ts";

test("native test discovery ignores comments, strings and nested helpers and rejects invalid signatures", () => {
  const scan = findNativeTests(`# def test_comment():
text = """
def test_string():
"""
def helper():
    def test_nested(): pass
def test_ok(): pass
@decorator
def test_decorated(): pass
async def test_async(): pass
def test_arg(value): pass
`);
  assert.deepEqual(scan.tests.map((t) => t.name), ["test_ok", "test_decorated", "test_async", "test_arg"]);
  assert.equal(scan.problems.length, 3);
});

test("an item runner override is validated, compiled, revisioned and carried to dynamic jobs", async () => {
  const pack = await load(FIXTURE_PACK);
  const item = pack.items[1];
  assert.ok(pack.manifest && item?.manifest && item.checks);
  const before = itemRevision(pack.manifest, item);
  item.manifest.runner = "iverilog-native@1";
  item.manifest.design.sourceOrder = ["lamp.v", "top_module.v"];
  item.checks.content = "def test_lamps():\n    assert True\n";
  assert.deepEqual(await checkPack(pack), []);
  const compiled = compileItem(pack.manifest, item);
  assert.equal(compiled.runner, "iverilog-native@1");
  assert.deepEqual(compiled.design.sourceOrder, ["lamp.v", "top_module.v"]);
  assert.notEqual(compiled.revision, before);
  const revision = itemRevision(pack.manifest, item);
  pack.manifest.runner = "ghdl-cocotb@1";
  assert.equal(itemRevision(pack.manifest, item), revision, "an overridden default does not change the revision");
  const built = buildTestJob(pack.manifest, item, { kind: "reference", name: "example.v" });
  assert.ok(built.ok);
  assert.equal(built.request.runner, "iverilog-native@1");
  assert.deepEqual(built.request.sourceOrder, ["lamp.v", "top_module.v"]);
  item.manifest.runner = "ghdl-native@1";
  assert.ok((await checkPack(pack)).some((d) => d.item === item.slug && /does not accept/.test(d.message)));
  item.manifest.design.sourceOrder = ["top_module.v", "top_module.v"];
  assert.ok((await checkPack(pack)).some((d) => /sourceOrder/.test(d.message)));
});

test("JSON wrong bundles replace only the solution and named editable files", async () => {
  const pack = await load(FIXTURE_PACK);
  const item = pack.items[1];
  assert.ok(pack.manifest && item?.manifest);
  item.manifest.checks.wrong = ["bundle.json"];
  const build = () => buildTestJob(pack.manifest!, item, { kind: "wrong", name: "bundle.json" });
  item.wrong.set("bundle.json", JSON.stringify({ source: "wrong solution", sourceFiles: { "lamp.v": "wrong lamp" } }));
  const built = build();
  assert.ok(built.ok);
  assert.deepEqual(built.request.files, { "lamp.v": "wrong lamp", "top_module.v": "wrong solution" });
  item.stages.set("task_1.json", item.wrong.get("bundle.json")!);
  const stage = buildTestJob(pack.manifest, item, { kind: "stage", name: "task_1.json", task: 1 });
  assert.ok(stage.ok);
  assert.deepEqual(stage.request.files, built.request.files);
  item.wrong.set("bundle.json", JSON.stringify({ source: "wrong solution", sourceFiles: {} }));
  const omitted = build();
  assert.ok(omitted.ok);
  assert.equal(omitted.request.files["lamp.v"], item.reference.get("lamp.v"));
  for (const bundle of [
    { source: "wrong", sourceFiles: { "unknown.v": "bad" } },
    { source: "wrong", sourceFiles: { "../escape.v": "bad" } },
    { source: "wrong", sourceFiles: {}, unexpected: true },
  ]) {
    item.wrong.set("bundle.json", JSON.stringify(bundle));
    assert.equal(build().ok, false);
    assert.ok((await checkPack(pack)).some((d) => /solution bundle/.test(d.message)));
  }
});
