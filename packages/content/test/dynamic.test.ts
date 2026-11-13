/** The dynamic checks, against a fake RunnerClient: job requests, verdicts, concurrency and an unreachable service. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { RunnerUnavailableError } from "@compass/runner-client";
import { TestJobRequest, type RunReport, type TestResult } from "@compass/schema";
import { buildTestJob, judgeRun, planRuns, runDynamicChecks, type PlannedRun, type RunOutcome } from "../src/dynamic.ts";
import type { LoadedPack } from "../src/loader.ts";
import { FIXTURE_PACK, fakeRunner, load, messages, simulate } from "./helpers.ts";

async function plan(): Promise<{ pack: LoadedPack; runs: PlannedRun[] }> {
  const pack = await load(FIXTURE_PACK);
  const planned = planRuns(pack, pack.items);
  assert.deepEqual(planned.diagnostics, []);
  return { pack, runs: planned.runs };
}

function find(runs: readonly PlannedRun[], file: string): PlannedRun {
  const run = runs.find((candidate) => candidate.file === file);
  assert.ok(run, file);
  return run;
}

test("each item plans its reference, its wrong solutions and its stages", async () => {
  const { runs } = await plan();
  assert.deepEqual(
    runs.map((run) => run.file),
    [
      "items/drive-high/reference/exemplar.v",
      "items/drive-high/wrong/low.v",
      "items/drive-high/stages/task_1.v",
      "items/drive-high/stages/task_2.v",
      "items/light-bank/reference/example.v",
      "items/light-bank/wrong/one_lamp.v",
    ],
  );
  for (const run of runs) assert.equal(TestJobRequest.safeParse(run.request).success, true, run.file);
});

test("a job carries the starter files with the solution replaced by the variant", async () => {
  const { pack, runs } = await plan();
  const drive = pack.items[0];
  assert.ok(drive?.checks);
  const reference = find(runs, "items/drive-high/reference/exemplar.v").request;
  assert.deepEqual(Object.keys(reference), ["runner", "top", "solution", "files", "checks", "itemKind", "tasks"]);
  assert.equal(reference.runner, "iverilog-cocotb@1");
  assert.equal(reference.top, "top_module");
  assert.equal(reference.solution, "top_module.v");
  assert.equal(reference.itemKind, "concept");
  assert.deepEqual(reference.files, { "top_module.v": drive.reference.get("exemplar.v") });
  assert.deepEqual(reference.checks, drive.checks);
  assert.deepEqual(reference.tasks, [
    { id: 1, tests: ["output_port_is_one_bit"] },
    { id: 2, tests: ["output_is_high", "output_stays_high"] },
  ]);
  assert.equal(reference.taskId, undefined, "a check runs the full tests");
  assert.equal(find(runs, "items/drive-high/stages/task_1.v").request.files["top_module.v"], drive.stages.get("task_1.v"));
});

test("editable support files come from reference/, read-only ones from starter/", async () => {
  const { pack, runs } = await plan();
  const bank = pack.items[1];
  assert.ok(bank);
  const reference = find(runs, "items/light-bank/reference/example.v").request;
  assert.deepEqual(reference.files, { "lamp.v": bank.reference.get("lamp.v"), "top_module.v": bank.reference.get("example.v") });
  assert.equal(reference.itemKind, "practice");
  assert.equal("tasks" in reference, false);
  const wrong = find(runs, "items/light-bank/wrong/one_lamp.v").request;
  assert.deepEqual(wrong.files, { "lamp.v": bank.reference.get("lamp.v"), "top_module.v": bank.wrong.get("one_lamp.v") });
  assert.ok(pack.manifest);
  const readOnly = structuredClone(bank.manifest);
  assert.ok(readOnly);
  readOnly.design.editable = [];
  const built = buildTestJob(pack.manifest, { ...bank, manifest: readOnly }, { kind: "reference", name: "example.v" });
  assert.ok(built.ok);
  assert.equal(built.request.files["lamp.v"], bank.starter.get("lamp.v"));
});

test("a fixture that behaves gives no diagnostics, with at most four jobs in flight", async () => {
  const { runs } = await plan();
  const many = Array.from({ length: 5 }, () => runs).flat();
  const client = fakeRunner();
  const result = await runDynamicChecks(many, { client });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.unreachable, undefined);
  assert.equal(result.outcomes.length, many.length);
  assert.equal(client.requests.length, many.length);
  assert.equal(client.maxInFlight, 4);
  const single = fakeRunner();
  await runDynamicChecks(many, { client: single, concurrency: 1 });
  assert.equal(single.maxInFlight, 1);
});

const report = (tests: [string, TestResult["status"], number?][]): RunOutcome => {
  const results: TestResult[] = tests.map(([name, status, task]) => ({
    name,
    status,
    test_code: "async def x(dut): ...",
    ...(status === "pass" ? {} : { message: `${name} ${status}ed\ndetail` }),
    ...(task === undefined ? {} : { task_id: task }),
  }));
  const status: RunReport["status"] = results.every((test) => test.status === "pass") ? "pass" : "fail";
  return { kind: "report", report: { status, tests: results } as RunReport };
};

test("verdicts: the reference must pass every test", async () => {
  const { runs } = await plan();
  const run = find(runs, "items/drive-high/reference/exemplar.v");
  const all = (status: TestResult["status"]) =>
    report([
      ["output_port_is_one_bit", "pass", 1],
      ["output_is_high", status, 2],
      ["output_stays_high", status, 2],
    ]);
  assert.deepEqual(judgeRun(run, all("pass")), []);
  assert.deepEqual(messages(judgeRun(run, all("fail"))), [
    "error: the reference fails 2 of 3 tests: output_is_high (output_is_high failed); output_stays_high (output_stays_high failed)",
  ]);
  assert.deepEqual(messages(judgeRun(run, { kind: "report", report: { status: "error", message: "syntax error\nmore" } })), [
    "error: the reference reached no test verdict: syntax error",
  ]);
  assert.deepEqual(messages(judgeRun(run, report([["output_port_is_one_bit", "pass", 1]]))), [
    "warning: the runner reported 1 test results; the checks file defines 3 tests",
  ]);
});

test("verdicts: a wrong solution must compile and fail a test", async () => {
  const { runs } = await plan();
  const run = find(runs, "items/drive-high/wrong/low.v");
  const failing = report([
    ["output_port_is_one_bit", "pass", 1],
    ["output_is_high", "fail", 2],
    ["output_stays_high", "fail", 2],
  ]);
  assert.deepEqual(judgeRun(run, failing), []);
  assert.deepEqual(messages(judgeRun(run, report([["output_port_is_one_bit", "pass", 1]]))), [
    "error: the wrong solution low.v passes every test; a wrong solution must fail a test",
  ]);
  assert.deepEqual(messages(judgeRun(run, { kind: "report", report: { status: "error", message: "top_module.v:3: syntax error" } })), [
    "error: the wrong solution low.v reached no test verdict; a wrong solution must compile and fail a test: top_module.v:3: syntax error",
  ]);
  assert.deepEqual(messages(judgeRun(run, { kind: "failed", errorKind: "timeout", message: "The run took longer than 30 s." })), [
    "error: the wrong solution low.v could not be run (timeout): The run took longer than 30 s.",
  ]);
  assert.deepEqual(messages(judgeRun(run, report([["output_port_is_one_bit", "error", 1]]))), [
    "warning: the wrong solution low.v makes tests stop with an error rather than fail: output_port_is_one_bit (output_port_is_one_bit errored)",
  ]);
  assert.deepEqual(messages(judgeRun(run, { kind: "cancelled" })), ["error: the run of the wrong solution low.v was cancelled"]);
});

test("verdicts: a stage passes its task and every earlier task", async () => {
  const { runs } = await plan();
  const first = find(runs, "items/drive-high/stages/task_1.v");
  const second = find(runs, "items/drive-high/stages/task_2.v");
  const partial = report([
    ["output_port_is_one_bit", "pass", 1],
    ["output_is_high", "fail", 2],
    ["output_stays_high", "fail", 2],
  ]);
  assert.deepEqual(judgeRun(first, partial), [], "a later task may still fail");
  assert.deepEqual(messages(judgeRun(second, partial)), [
    "error: the stage of task 2 fails task 2: output_is_high (output_is_high failed); output_stays_high (output_stays_high failed)",
  ]);
  assert.deepEqual(messages(judgeRun(second, report([["output_port_is_one_bit", "pass", 1]]))), [
    "error: the runner reported no results for task 2",
  ]);
  const diagnostic = judgeRun(second, partial)[0];
  assert.deepEqual(diagnostic && [diagnostic.rule, diagnostic.pack, diagnostic.item, diagnostic.file], [
    "stage",
    "verilog",
    "drive-high",
    "items/drive-high/stages/task_2.v",
  ]);
});

test("a full run reports wrong behaviour from the runner", async () => {
  const { runs } = await plan();
  const client = fakeRunner((request) => {
    const solution = request.files[request.solution] ?? "";
    if (solution.includes("assign out = 1'b0")) return { status: "error", message: "the wrong solution did not compile" };
    if (solution.includes("lamp second")) return { error: { kind: "unavailable", message: "Docker is not running." } };
    return simulate(request);
  });
  const result = await runDynamicChecks(runs, { client });
  assert.deepEqual(
    result.diagnostics.map((d) => [d.rule, d.file, d.severity]),
    [
      ["wrong", "items/drive-high/wrong/low.v", "error"],
      ["reference", "items/light-bank/reference/example.v", "error"],
    ],
  );
});

test("a full queue is retried; an unknown or missing image is reported once per pack", async () => {
  const { runs } = await plan();
  const busy = fakeRunner(simulate, { rejectFirst: 3 });
  const retried = await runDynamicChecks(runs, { client: busy, retryDelayMs: 1 });
  assert.deepEqual(retried.diagnostics, []);
  assert.equal(busy.requests.length, runs.length);
  const missing = fakeRunner(simulate, { available: false });
  const result = await runDynamicChecks(runs, { client: missing });
  assert.equal(missing.requests.length, 0);
  assert.deepEqual(messages(result.diagnostics), [
    "error: the runner iverilog-cocotb@1 is not available at http://127.0.0.1:3999: the image compass/iverilog-cocotb:1 is not built or Docker is not running",
  ]);
});

test("an unreachable runner is said plainly and stops the runs", async () => {
  const { runs } = await plan();
  const down = fakeRunner(simulate, { unreachable: true });
  const result = await runDynamicChecks(runs, { client: down });
  assert.equal(result.unreachable, "The runner service at http://127.0.0.1:3999 could not be reached.");
  assert.equal(down.requests.length, 0);
  const flaky = fakeRunner();
  let submitted = 0;
  const submit = flaky.submit.bind(flaky);
  flaky.submit = async (request) => {
    if (++submitted > 2) throw new RunnerUnavailableError(flaky.url);
    return submit(request);
  };
  const stopped = await runDynamicChecks(runs, { client: flaky, concurrency: 1 });
  assert.equal(stopped.unreachable, "The runner service at http://127.0.0.1:3999 could not be reached.");
  assert.equal(stopped.outcomes.length, 2);
});
