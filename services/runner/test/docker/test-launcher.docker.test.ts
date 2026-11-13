import test from "node:test";
import assert from "node:assert/strict";
import type { RunReport, TestJobResult } from "@compass/schema";
import { createDockerExecutor } from "../../src/executor.ts";
import { JobFailure } from "../../src/failure.ts";
import { JobQueue } from "../../src/queue.ts";
import { inspectImage } from "../../src/sandbox.ts";
import { runTestJob } from "../../src/test-launcher.ts";
import { containers, loadFixture } from "./fixtures.ts";

const signal = new AbortController().signal;
const run = (request: Parameters<typeof runTestJob>[0], timeoutMs?: number) =>
  runTestJob(request, { signal, ...(timeoutMs ? { timeoutMs } : {}) });

function tests(report: RunReport) {
  assert.notEqual(report.status, "error", JSON.stringify(report));
  return report.status === "error" ? [] : report.tests;
}

const INFINITE = "module top_module(output wire out); initial begin forever begin end end endmodule";

test("the image is built", async () => {
  assert.match((await inspectImage("compass/iverilog-cocotb:1")) ?? "", /^sha256:[a-f0-9]{64}$/);
});

test("a reference passes and every wrong solution fails", { timeout: 180_000 }, async () => {
  const drive = await loadFixture("drive-high");
  const passing = await run(drive.test(drive.referenceSource));
  assert.equal(passing.report.status, "pass", JSON.stringify(passing.report));
  assert.deepEqual(
    tests(passing.report).map((t) => [t.task_id, t.status]),
    [
      [1, "pass"],
      [2, "pass"],
      [2, "pass"],
    ],
  );
  assert.match(tests(passing.report)[0]?.test_code ?? "", /async def output_port_is_one_bit/);
  assert.equal(passing.imageId, await inspectImage("compass/iverilog-cocotb:1"));
  assert.match(passing.log, /output_is_high/);

  const low = await run(drive.test(drive.wrongSources["low.v"] ?? ""));
  assert.equal(low.report.status, "fail");
  assert.match(tests(low.report).find((t) => t.status === "fail")?.message ?? "", /Expected out = 1.*observed 0/);

  const starter = await run(drive.test(drive.starterSource));
  assert.notEqual(starter.report.status, "pass", "The starter must not pass.");

  for (const slug of ["workshop-controls", "accept-a-transfer-and-hold-it"]) {
    const fixture = await loadFixture(slug);
    const reference = await run(fixture.test(fixture.referenceSource));
    assert.equal(reference.report.status, "pass", `${slug}: ${JSON.stringify(reference.report)}`);
    for (const [name, source] of Object.entries(fixture.wrongSources)) {
      const wrong = await run(fixture.test(source));
      assert.equal(wrong.report.status, "fail", `${slug}/${name} must compile and fail a test.`);
    }
  }
});

test("a compile error gives a report with status error", { timeout: 60_000 }, async () => {
  const drive = await loadFixture("drive-high");
  const result = await run(drive.test("module top_module( invalid syntax endmodule"));
  assert.equal(result.report.status, "error");
  if (result.report.status === "error")
    assert.match(result.report.message, /Compilation or simulation could not complete/);
  assert.equal(result.waveform, undefined);
});

test(
  "a selected task runs only its tests, and a concept item without tasks has an implicit task 1",
  { timeout: 120_000 },
  async () => {
    const drive = await loadFixture("drive-high");
    const stage1 = drive.stageSources["task_1.v"] ?? "";
    const first = await run(drive.test(stage1, { taskId: 1 }));
    assert.equal(first.report.status, "pass", JSON.stringify(first.report));
    assert.deepEqual(
      tests(first.report).map((t) => t.task_id),
      [1],
    );
    assert.match(first.log, /running test_output\.output_port_is_one_bit\s/);
    assert.doesNotMatch(first.log, /running test_output\.output_is_high\s/);

    const second = await run(drive.test(stage1, { taskId: 2 }));
    assert.equal(second.report.status, "fail");
    assert.deepEqual(
      tests(second.report).map((t) => t.task_id),
      [2, 2],
    );

    const workshop = await loadFixture("workshop-controls");
    const third = await run(workshop.test(workshop.referenceSource, { taskId: 3 }));
    assert.equal(third.report.status, "pass");
    assert.equal(tests(third.report).length, 3);

    const whole = await run(drive.test(drive.referenceSource, { tasks: undefined }));
    assert.ok(tests(whole.report).every((t) => t.task_id === undefined));
    const implicit = await run(drive.test(drive.referenceSource, { tasks: undefined, taskId: 1 }));
    assert.deepEqual(
      tests(implicit.report),
      tests(whole.report).map((t) => ({ ...t, task_id: 1 })),
    );

    const unmapped = await run(drive.test(drive.referenceSource, { tasks: [{ id: 1, tests: ["output_is_high"] }] }));
    assert.equal(unmapped.report.status, "error");
    if (unmapped.report.status === "error") assert.match(unmapped.report.message, /Unmapped: output_port_is_one_bit/);

    await assert.rejects(
      run(drive.test(drive.referenceSource, { taskId: 3 })),
      (error) => error instanceof JobFailure && error.kind === "execution" && /task ID/.test(error.message),
    );
  },
);

test("a clocked design returns a VCD waveform", { timeout: 60_000 }, async () => {
  const fixture = await loadFixture("accept-a-transfer-and-hold-it");
  const result: TestJobResult = await run(fixture.test(fixture.referenceSource));
  assert.equal(result.report.status, "pass");
  assert.ok(result.waveform, "A waveform is returned.");
  assert.match(result.waveform, /\$enddefinitions/);
  assert.match(result.waveform, /\$var wire\s+1 \S+ clk /);
  assert.match(result.waveform, /^#\d+/m);
});

test("the sandbox has no network", { timeout: 60_000 }, async () => {
  const drive = await loadFixture("drive-high");
  const checks = `import socket
import cocotb


@cocotb.test()
async def no_route_out(dut):
    """The container cannot open a connection."""
    for host in ("1.1.1.1", "8.8.8.8"):
        try:
            socket.create_connection((host, 53), timeout=2).close()
        except OSError:
            continue
        raise AssertionError(f"Connected to {host}.")


@cocotb.test()
async def loopback_only(dut):
    """The only interface is the loopback."""
    with open("/proc/net/dev") as devices:
        names = [line.split(":")[0].strip() for line in devices.readlines()[2:]]
    assert names == ["lo"], f"Interfaces: {names}"
`;
  const result = await run(
    drive.test(drive.referenceSource, { checks: { name: "test_network.py", content: checks }, tasks: undefined }),
  );
  assert.equal(result.report.status, "pass", JSON.stringify(result.report));
});

test("an infinite loop times out and leaves no container behind", { timeout: 60_000 }, async () => {
  const before = new Set(containers("compass-run-"));
  const drive = await loadFixture("drive-high");
  await assert.rejects(
    run(drive.test(INFINITE), 2000),
    (error) => error instanceof JobFailure && error.kind === "timeout",
  );
  assert.deepEqual(
    containers("compass-run-").filter((id) => !before.has(id)),
    [],
  );
});

test("the image stops a simulation that runs past its own limit", { timeout: 60_000 }, async () => {
  const drive = await loadFixture("drive-high");
  const result = await run(drive.test(INFINITE));
  assert.equal(result.report.status, "error");
  if (result.report.status === "error") assert.match(result.report.message, /time limit/);
});

test("cancelling a running job removes its container", { timeout: 60_000 }, async () => {
  const before = new Set(containers("compass-run-"));
  const queue = new JobQueue({ executor: createDockerExecutor({ timeoutMs: 30_000 }) });
  const drive = await loadFixture("drive-high");
  const job = queue.submit(drive.test(INFINITE));
  assert.equal(job.state, "running");
  for (let i = 0; i < 50 && containers("compass-run-").every((id) => before.has(id)); i++)
    await new Promise((resolve) => setTimeout(resolve, 200));
  assert.ok(
    containers("compass-run-").some((id) => !before.has(id)),
    "The container started.",
  );
  assert.equal(queue.cancel(job.id)?.state, "cancelled");
  await queue.close();
  assert.equal(queue.get(job.id)?.state, "cancelled");
  assert.deepEqual(
    containers("compass-run-").filter((id) => !before.has(id)),
    [],
  );
});
