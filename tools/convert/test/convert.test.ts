import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, existsSync } from "node:fs";
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
    assert.deepEqual(course.item, [
      { slug: "alpha", prerequisites: [] },
      { slug: "beta", prerequisites: ["c1"] },
    ]);
    assert.deepEqual(course.concept, [{ slug: "c1", name: "One" }]);
    assert.equal(readFileSync(join(out, "concepts/c1/about.md"), "utf8"), "about c1 **Waveform**\n");
    assert.equal(existsSync(join(out, "concepts/c0")), false);
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
