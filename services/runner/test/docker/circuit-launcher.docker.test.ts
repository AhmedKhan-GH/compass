import test from "node:test";
import assert from "node:assert/strict";
import { runCircuitJob } from "../../src/circuit-launcher.ts";
import { JobFailure } from "../../src/failure.ts";
import { inspectImage } from "../../src/sandbox.ts";
import { loadFixture } from "./fixtures.ts";

const signal = new AbortController().signal;

test("the image is built", async () => {
  assert.match((await inspectImage("compass/yosys-digitaljs:1")) ?? "", /^sha256:[a-f0-9]{64}$/);
});

test("the circuit runner builds a circuit from each reference", { timeout: 120_000 }, async () => {
  const drive = await loadFixture("drive-high");
  const constant = await runCircuitJob(drive.circuit(drive.referenceSource), { signal });
  assert.equal(constant.kind, "circuit");
  assert.equal(constant.imageId, await inspectImage("compass/yosys-digitaljs:1"));
  assert.deepEqual(constant.ports, [{ name: "out", direction: "output", bits: 1 }]);
  assert.ok(Object.keys(constant.circuit.devices as object).length > 0);

  const workshop = await loadFixture("workshop-controls");
  const gates = await runCircuitJob(workshop.circuit(workshop.referenceSource), { signal });
  assert.deepEqual(gates.ports.map((port) => `${port.direction} ${port.name}`).sort(), [
    "input blocked",
    "input button_a",
    "input button_b",
    "output available",
    "output start",
  ]);

  const clocked = await loadFixture("accept-a-transfer-and-hold-it");
  const registers = await runCircuitJob(clocked.circuit(clocked.referenceSource), { signal });
  assert.ok(registers.ports.some((port) => port.name === "out_data" && port.bits === 8));
  const devices = Object.values(registers.circuit.devices as Record<string, { type: string }>);
  assert.ok(
    devices.some((device) => device.type === "Dff"),
    "The register appears as a flip-flop.",
  );
});

test("the circuit runner rejects a broken design with a design error", { timeout: 120_000 }, async () => {
  const drive = await loadFixture("drive-high");
  const cases = [
    { source: "module top_module(output wire out); assign out = ; endmodule", message: /syntax error/i },
    {
      source: "module top_module(input wire [32:0] data, output wire [32:0] out); assign out = data; endmodule",
      message: /ports up to 32 bits/i,
    },
    { source: "module other(output wire out); assign out = 1'b1; endmodule", message: /top_module/ },
  ];
  for (const { source, message } of cases) {
    await assert.rejects(runCircuitJob(drive.circuit(source), { signal }), (error) => {
      assert.ok(error instanceof JobFailure, String(error));
      assert.equal(error.kind, "design");
      assert.match(error.message, message);
      assert.ok(error.message.length <= 8000);
      return true;
    });
  }
});
