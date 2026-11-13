import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { parse } from "smol-toml";
import { CourseManifest, ItemManifest } from "@compass/schema";
import { convert } from "../src/convert.ts";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
const ID_C = "33333333-3333-4333-8333-333333333333";

let root: string;
let old: string;
let out: string;

function put(path: string, content: string): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, content);
}

function exerciseConfig(runner: string, extra: object = {}, files: object = {}): string {
  return JSON.stringify({
    blurb: "A blurb.",
    files: { solution: ["top_module.v"], test: ["test_a.py"], exemplar: [".meta/exemplar.v"], ...files },
    custom: { nebula: { runner, top_module: "top_module", incorrect: [".meta/incorrect/low.v"], ...extra } },
  });
}

function tree(dir: string): string[] {
  const names: string[] = [];
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) names.push(...tree(p).map((x) => `${n}/${x}`));
    else names.push(n);
  }
  return names;
}

before(() => {
  root = mkdtempSync(join(tmpdir(), "convert-test-"));
  old = join(root, "legacy");
  out = join(root, "pack");
  const track = join(old, "tracks", "fake");
  put(
    join(track, "config.json"),
    JSON.stringify({
      exercises: {
        concept: [
          { uuid: ID_A, slug: "alpha", name: "Alpha topic", concepts: ["c1"], prerequisites: [] },
          { uuid: ID_C, slug: "gamma", name: "Gamma topic", concepts: ["c2"], prerequisites: ["c1"], status: "beta" },
        ],
        practice: [
          { uuid: ID_B, slug: "beta", name: "Beta topic", practices: ["c1"], prerequisites: ["c1"], difficulty: 3, status: "active" },
        ],
      },
      concepts: [
        { uuid: ID_A, slug: "c0", name: "Unused" },
        { uuid: ID_A, slug: "c1", name: "One" },
        { uuid: ID_A, slug: "c2", name: "Two" },
      ],
      custom: { nebula: { learning_path: ["alpha", "beta", "gamma"], display_names: { alpha: "Alpha Title" } } },
    }),
  );
  for (const c of ["c0", "c1", "c2"]) {
    put(join(track, "concepts", c, "introduction.md"), `intro ${c}\n`);
    put(join(track, "concepts", c, "about.md"), `about ${c} **Waveforms**\n`);
  }
  put(join(old, "VERILOG_SYLLABUS.md"), "# Syllabus\n**Schematic**\n");
  const a = join(track, "exercises", "concept", "alpha");
  put(
    join(a, ".meta", "config.json"),
    exerciseConfig("icarus-cocotb-v1", {
      tasks: [
        { id: 1, tests: ["t1"] },
        { id: 2, tests: ["t2", "t3"] },
      ],
    }),
  );
  put(join(a, "top_module.v"), "module top_module;\r\nendmodule\n");
  put(join(a, "test_a.py"), "# test\n");
  put(join(a, ".meta", "exemplar.v"), "module top_module; endmodule\n");
  put(join(a, ".meta", "incorrect", "low.v"), "bad\n");
  put(join(a, ".meta", "stages", "task_1.v"), "s1\n");
  put(join(a, ".meta", "design.md"), "notes\n");
  put(join(a, ".docs", "introduction.md"), "Open the **Schematic** and **Waveforms**; **Schematic** again.\n");
  put(join(a, ".docs", "instructions.md"), "Story\n\n## 1. One\n\nx\n\n## 2. Two\n\ny\n");
  put(join(a, ".docs", "hints.md"), "   \n\n");

  const b = join(track, "exercises", "practice", "beta");
  put(join(b, ".meta", "config.json"), exerciseConfig("icarus-cocotb-v1", {}, { exemplar: undefined, example: [".meta/example.v"], editor: ["helper.v"] }));
  put(join(b, "top_module.v"), "module top_module; endmodule\n");
  put(join(b, "helper.v"), "module helper; endmodule\n");
  put(join(b, "test_a.py"), "# test\n");
  put(join(b, ".meta", "example.v"), "module top_module; endmodule\n");
  put(join(b, ".meta", "incorrect", "low.v"), "bad\n");
  put(join(b, ".docs", "instructions.md"), "No tasks here.\n");
  put(join(b, ".meta/stages/task_1.v"), "obsolete stage");
  put(join(b, ".docs", "hints.md"), "A hint.\n");

  const g = join(track, "exercises", "concept", "gamma");
  put(join(g, ".meta", "config.json"), exerciseConfig("other-runner-v2"));
  put(join(g, ".docs", "instructions.md"), "x\n");
});

after(() => rmSync(root, { recursive: true, force: true }));

function run(slugs: string[] | "all") {
  return convert({ from: old, track: "fake", out, slugs });
}

describe("convert", () => {
  it("converts a concept item with tasks", () => {
    const result = run(["alpha"]);
    assert.equal(result.exercises[0]?.status, "converted");
    const item = ItemManifest.parse(parse(readFileSync(join(out, "items/alpha/item.toml"), "utf8")));
    assert.equal(item.id, ID_A);
    assert.equal(item.title, "Alpha Title");
    assert.equal(item.topic, "Alpha topic");
    assert.equal(item.kind, "concept");
    assert.deepEqual(item.concepts, ["c1"]);
    assert.equal(item.status, "active");
    assert.equal(item.difficulty, undefined);
    assert.deepEqual(item.checks, { file: "test_a.py", reference: "exemplar.v", wrong: ["low.v"] });
    assert.deepEqual(item.task, [
      { id: 1, tests: ["t1"], stage: "task_1.v" },
      { id: 2, tests: ["t2", "t3"] },
    ]);
    assert.deepEqual(tree(join(out, "items/alpha")), [
      "checks/test_a.py",
      "instructions.md",
      "intro.md",
      "item.toml",
      "notes.md",
      "reference/exemplar.v",
      "stages/task_1.v",
      "starter/top_module.v",
      "wrong/low.v",
    ]);
  });

  it("copies code byte for byte and skips an empty hints file", () => {
    assert.equal(readFileSync(join(out, "items/alpha/starter/top_module.v"), "utf8"), "module top_module;\r\nendmodule\n");
    assert.equal(existsSync(join(out, "items/alpha/hints.md")), false);
  });

  it("applies the substitutions to Markdown only", () => {
    const result = run(["alpha"]);
    assert.equal(
      readFileSync(join(out, "items/alpha/intro.md"), "utf8"),
      "Open the **Circuit** and **Waveform**; **Circuit** again.\n",
    );
    assert.deepEqual(result.exercises[0]?.substitutions, [
      { from: "**Schematic**", to: "**Circuit**", count: 2 },
      { from: "**Waveforms**", to: "**Waveform**", count: 1 },
    ]);
    // the syllabus is a plain copy
    assert.equal(readFileSync(join(out, "syllabus.md"), "utf8"), "# Syllabus\n**Schematic**\n");
  });

  it("converts a practice item without tasks, with support files and a difficulty", () => {
    run(["beta"]);
    const item = ItemManifest.parse(parse(readFileSync(join(out, "items/beta/item.toml"), "utf8")));
    assert.equal(item.kind, "practice");
    assert.equal(item.title, "Beta topic");
    assert.equal(item.difficulty, 3);
    assert.deepEqual(item.design.support, ["helper.v"]);
    assert.equal(item.task, undefined);
    assert.equal(existsSync(join(out, "items/beta/stages")), false);
    assert.equal(item.checks.reference, "example.v");
    assert.ok(existsSync(join(out, "items/beta/starter/helper.v")));
    assert.ok(existsSync(join(out, "items/beta/hints.md")));
  });

  it("refuses another runner and writes nothing for that exercise", () => {
    const result = run(["gamma"]);
    assert.equal(result.exercises[0]?.status, "refused");
    assert.match(result.exercises[0]?.message ?? "", /icarus-cocotb-v1/);
    assert.equal(existsSync(join(out, "items/gamma")), false);
    assert.equal(existsSync(join(out, ".staging")), false);
  });

  it("generates course.toml for the items present, in learning-path order", () => {
    run(["beta", "alpha"]);
    const course = CourseManifest.parse(parse(readFileSync(join(out, "course.toml"), "utf8")));
    assert.equal(course.id, "sternbild/verilog");
    assert.equal(course.status, "draft", "a partial conversion remains a draft");
    assert.deepEqual(course.item, [
      { slug: "alpha", prerequisites: [] },
      { slug: "beta", prerequisites: ["c1"] },
    ]);
    assert.deepEqual(course.concept, [{ slug: "c1", name: "One" }]);
    assert.equal(readFileSync(join(out, "concepts/c1/about.md"), "utf8"), "about c1 **Waveform**\n");
    assert.equal(existsSync(join(out, "concepts/c0")), false);
  });

  it("keeps pack-owned icons across a reconversion", () => {
    const icons: [string, string][] = [
      ["items/alpha/icon.svg", "<svg item/>"],
      ["icon.svg", "<svg course/>"],
      ["category-icon.svg", "<svg category/>"],
    ];
    for (const [f, c] of icons) writeFileSync(join(out, f), c);
    run(["alpha", "beta"]);
    for (const [f, c] of icons) assert.equal(readFileSync(join(out, f), "utf8"), c);
    for (const [f] of icons) rmSync(join(out, f));
  });

  it("writes the category between status and editor", () => {
    run(["alpha"]);
    const text = readFileSync(join(out, "course.toml"), "utf8");
    const course = CourseManifest.parse(parse(text));
    assert.deepEqual(course.category, { id: "rtl-design", title: "RTL design" });
    assert.ok(text.indexOf("status =") < text.indexOf("[category]"));
    assert.ok(text.indexOf("[category]") < text.indexOf("[editor]"));
  });

  it("is idempotent", () => {
    run(["alpha", "beta"]);
    const snapshot = (): Map<string, string> =>
      new Map(tree(out).map((f) => [f, readFileSync(join(out, f), "utf8")]));
    const first = snapshot();
    run(["alpha", "beta"]);
    assert.deepEqual(snapshot(), first);
  });

  it("does not write into the old repository", () => {
    assert.throws(() => convert({ from: old, track: "fake", out: join(old, "x"), slugs: ["alpha"] }), /old repository/);
  });

  it("reports an unknown slug", () => {
    assert.equal(run(["nope"]).exercises[0]?.status, "failed");
  });
});

it("links from the syllabus to documents outside the pack lose their target", async () => {
  const { unlinkOutsideDocuments } = await import("../src/convert.ts");
  assert.equal(
    unlinkOutsideDocuments("See [ROADMAP.md](ROADMAP.md), [the audit](AUDIT.md#part), [a site](https://example.org) and [below](#scope)."),
    "See ROADMAP.md, the audit, [a site](https://example.org) and [below](#scope).",
  );
});


it("converts VHDL entities, source order, stages and native graders while replacing a planned course", () => {
  const repo = join(root, "vhdl-old");
  const target = join(root, "vhdl-pack");
  const track = join(repo, "tracks/vhdl");
  cpSync(join(old, "tracks/fake"), track, { recursive: true });
  const config = JSON.parse(readFileSync(join(track, "config.json"), "utf8")) as Record<string, unknown>;
  config.language = "VHDL";
  const exercises = config.exercises as { concept: { slug: string }[] };
  exercises.concept = exercises.concept.filter((entry) => entry.slug !== "gamma");
  const custom = config.custom as { nebula: { learning_path: string[] } };
  custom.nebula.learning_path = ["alpha", "beta"];
  put(join(track, "config.json"), JSON.stringify(config));
  put(join(track, "README.md"), "# VHDL syllabus\n\nLearn entities.\n\n## Run and author\n\nOld commands.\n");
  for (const file of tree(track)) {
    const full = join(track, file);
    if (file.endsWith(".v")) {
      put(full + "hd", readFileSync(full, "utf8"));
      rmSync(full);
    } else if (file.endsWith(".meta/config.json")) {
      put(full, readFileSync(full, "utf8").replaceAll('.v"', '.vhd"').replaceAll("icarus-cocotb-v1", "ghdl-cocotb-v1"));
    }
  }
  const alpha = join(track, "exercises/concept/alpha/.meta/config.json");
  put(alpha, exerciseConfig("ghdl-cocotb-v1", {
    top_module: undefined, top_entity: "top_module", source_order: ["top_module.vhd"],
    incorrect: [".meta/incorrect/low.vhd"], tasks: [{ id: 1, tests: ["t1"] }],
  }, { solution: ["top_module.vhd"], exemplar: [".meta/exemplar.vhd"] }));
  const beta = join(track, "exercises/practice/beta/.meta/config.json");
  put(beta, readFileSync(beta, "utf8").replace("ghdl-cocotb-v1", "ghdl-native-v1"));
  put(join(target, "course.toml"), 'status = "in-development"\n[[planned]]\nslug = "alpha"\n');
  put(join(target, "icon.svg"), "course icon");
  put(join(target, "items/alpha/icon.svg"), "item icon");
  const result = convert({ from: repo, track: "vhdl", out: target, slugs: ["beta", "alpha"] });
  assert.deepEqual(result.exercises.map((e) => e.status), ["converted", "converted"]);
  const course = CourseManifest.parse(parse(readFileSync(join(target, "course.toml"), "utf8")));
  assert.equal(course.language, "vhdl");
  assert.equal(course.runner, "ghdl-cocotb@1");
  assert.equal(course.circuit, "ghdl-yosys-digitaljs@1");
  assert.equal(course.status, "published", "a complete conversion is available");
  assert.deepEqual(course.planned, []);
  assert.deepEqual(course.item.map((i) => i.slug), ["alpha", "beta"]);
  const item = ItemManifest.parse(parse(readFileSync(join(target, "items/alpha/item.toml"), "utf8")));
  assert.equal(item.design.top, "top_module");
  assert.deepEqual(item.design.sourceOrder, ["top_module.vhd"]);
  assert.equal(item.task?.[0]?.stage, "task_1.vhd");
  const native = ItemManifest.parse(parse(readFileSync(join(target, "items/beta/item.toml"), "utf8")));
  assert.equal(native.runner, "ghdl-native@1");
  assert.equal(native.design.schematic, false);
  assert.equal(readFileSync(join(target, "syllabus.md"), "utf8"), "# VHDL syllabus\n\nLearn entities.\n");
  const snapshot = tree(target).map((name) => [name, readFileSync(join(target, name), "utf8")]);
  convert({ from: repo, track: "vhdl", out: target, slugs: ["alpha", "beta"] });
  assert.deepEqual(tree(target).map((name) => [name, readFileSync(join(target, name), "utf8")]), snapshot);
  assert.equal(readFileSync(join(target, "icon.svg"), "utf8"), "course icon");
  assert.equal(readFileSync(join(target, "items/alpha/icon.svg"), "utf8"), "item icon");
});

it("preserves native Verilog and multi-file wrong and stage bundles, refusing invalid bundles before replacing an item", () => {
  const repo = join(root, "native-old");
  const target = join(root, "native-pack");
  cpSync(old, repo, { recursive: true });
  const dir = join(repo, "tracks/fake/exercises/concept/alpha");
  const bundle = JSON.stringify({ source: "solution", sourceFiles: { "helper.v": "helper" } }, null, 2);
  put(join(dir, ".meta/config.json"), exerciseConfig("icarus-native-v1", {
    editable_files: ["helper.v"], exemplar_files: { "helper.v": ".meta/helper.v" },
    incorrect: [".meta/incorrect/mistake.json"], tasks: [{ id: 1, tests: ["test_checker"] }],
  }, { editor: ["helper.v"] }));
  put(join(dir, "helper.v"), "starter helper");
  put(join(dir, ".meta/helper.v"), "reference helper");
  put(join(dir, ".meta/incorrect/mistake.json"), bundle);
  rmSync(join(dir, ".meta/stages/task_1.v"));
  put(join(dir, ".meta/stages/task_1.json"), bundle);
  const options = { from: repo, track: "fake", out: target, slugs: ["alpha"] };
  assert.equal(convert(options).exercises[0]?.status, "converted");
  const itemPath = join(target, "items/alpha/item.toml");
  const item = ItemManifest.parse(parse(readFileSync(itemPath, "utf8")));
  assert.equal(item.runner, "iverilog-native@1");
  assert.equal(item.task?.[0]?.stage, "task_1.json");
  assert.equal(readFileSync(join(target, "items/alpha/wrong/mistake.json"), "utf8"), bundle);
  assert.equal(readFileSync(join(target, "items/alpha/stages/task_1.json"), "utf8"), bundle);
  put(join(dir, ".meta/incorrect/mistake.json"), JSON.stringify({ source: "bad", sourceFiles: { "foreign.v": "bad" } }));
  const before = readFileSync(itemPath, "utf8");
  assert.equal(convert(options).exercises[0]?.status, "failed");
  assert.equal(readFileSync(itemPath, "utf8"), before);
});
