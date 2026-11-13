import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CourseManifest,
  ItemManifest,
  Job,
  JobRequest,
  RunReport,
  isCircuitRunnerKind,
  isEnvironmentKind,
  isTestRunnerKind,
  splitCourseId,
  toItemView,
  type IndexedItem,
} from "../src/index.ts";

const item = {
  id: "9a2fa263-5ac6-47ef-9388-b845860ca190",
  title: "First Light",
  blurb: "Give a museum exhibit its first always-on power indicator.",
  kind: "concept",
  concepts: ["constants"],
  design: { top: "top_module", solution: "top_module.v" },
  checks: { file: "test_output.py", reference: "exemplar.v", wrong: ["low.v"] },
  task: [{ id: 1, tests: ["output_port_is_one_bit"], stage: "task_1.v" }],
};

test("an item manifest gets its defaults", () => {
  const parsed = ItemManifest.parse(item);
  assert.equal(parsed.status, "active");
  assert.deepEqual(parsed.design.support, []);
  assert.equal(parsed.design.schematic, true);
});

test("an item manifest rejects unknown keys and paths", () => {
  assert.equal(ItemManifest.safeParse({ ...item, extra: 1 }).success, false);
  assert.equal(
    ItemManifest.safeParse({ ...item, checks: { ...item.checks, reference: "../exemplar.v" } }).success,
    false,
  );
});

test("a course manifest needs a namespaced id and versioned kinds", () => {
  const course = {
    id: "sternbild/verilog",
    version: "0.1.0",
    title: "RTL design with Verilog",
    blurb: "Short exercises in synthesizable Verilog.",
    language: "verilog",
    environment: "code@1",
    runner: "iverilog-cocotb@1",
    item: [{ slug: "drive-high" }],
  };
  assert.equal(CourseManifest.parse(course).status, "draft");
  assert.equal(CourseManifest.safeParse({ ...course, id: "verilog" }).success, false);
  assert.equal(CourseManifest.safeParse({ ...course, runner: "iverilog-cocotb" }).success, false);
  assert.deepEqual(splitCourseId("sternbild/verilog"), { namespace: "sternbild", name: "verilog" });
});

test("the registry separates test runners, circuit runners and environments", () => {
  assert.equal(isTestRunnerKind("iverilog-cocotb@1"), true);
  assert.equal(isTestRunnerKind("yosys-digitaljs@1"), false);
  assert.equal(isCircuitRunnerKind("yosys-digitaljs@1"), true);
  assert.equal(isTestRunnerKind("iverilog-cocotb@2"), false);
  assert.equal(isEnvironmentKind("code@1"), true);
  assert.equal(isEnvironmentKind("toString"), false);
});

test("a job request is discriminated by its runner", () => {
  const files = { "top_module.v": "module top_module; endmodule\n" };
  const request = JobRequest.parse({
    runner: "iverilog-cocotb@1",
    top: "top_module",
    solution: "top_module.v",
    files,
    checks: { name: "test_output.py", content: "import cocotb\n" },
    itemKind: "concept",
  });
  assert.equal(request.runner, "iverilog-cocotb@1");
  assert.equal(
    JobRequest.safeParse({ runner: "yosys-digitaljs@1", top: "top_module", solution: "top_module.v", files, checks: {} })
      .success,
    false,
  );
  assert.equal(JobRequest.safeParse({ runner: "unknown@1", top: "t", solution: "t.v", files }).success, false);
});

test("a report with a verdict needs tests", () => {
  assert.equal(RunReport.safeParse({ status: "pass", tests: [] }).success, false);
  assert.equal(RunReport.safeParse({ status: "error", message: "Compilation failed." }).success, true);
  assert.equal(Job.safeParse({ id: "1", runner: "iverilog-cocotb@1", state: "queued", createdAt: "now" }).success, true);
});

test("the item view drops the checks", () => {
  const indexed = { slug: "drive-high", checks: { name: "t.py", content: "secret" } } as unknown as IndexedItem;
  assert.equal("checks" in toItemView(indexed), false);
});
