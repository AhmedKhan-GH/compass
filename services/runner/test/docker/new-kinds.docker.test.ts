import test from "node:test";
import assert from "node:assert/strict";
import type { CircuitJobRequest, TestJobRequest } from "@compass/schema";
import { runTestJob } from "../../src/test-launcher.ts";
import { runCircuitJob } from "../../src/circuit-launcher.ts";
import { JobFailure } from "../../src/failure.ts";

const signal = new AbortController().signal;
const vhdl = (value: string) => `library ieee; use ieee.std_logic_1164.all; use ieee.numeric_std.all;
entity top_module is port (out_value: out std_logic); end;
architecture rtl of top_module is begin out_value <= '${value}'; end;`;
const cocotb: TestJobRequest = {
  runner: "ghdl-cocotb@1", top: "top_module", solution: "top_module.vhd",
  files: { "top_module.vhd": vhdl("1") }, itemKind: "concept",
  checks: { name: "test_output.py", content: `import cocotb
from cocotb.triggers import Timer
@cocotb.test()
async def high(dut):
    await Timer(1, unit="ns")
    assert int(dut.out_value.value) == 1, "Expected high"
@cocotb.test()
async def port_exists(dut):
    assert len(dut.out_value) == 1
` }, tasks: [{ id: 1, tests: ["high"] }, { id: 2, tests: ["port_exists"] }],
};

const nativeChecks = `from nebula_native import simulate
def test_checker():
    result = simulate()
    assert not result.timed_out, "Testbench timed out"
    assert "PASS" in result.stdout, result.stdout or "Missing verdict"
def test_again():
    result = simulate()
    assert "PASS" in result.stdout, "Missing verdict"
`;
const nativeVerilog: TestJobRequest = {
  runner: "iverilog-native@1", top: "testbench", solution: "testbench.v", itemKind: "concept",
  files: { "testbench.v": 'module testbench; reg value; initial begin value = 1; #1; $display("PASS"); $finish; end endmodule',
    "dut_correct.v": "module dut; endmodule" },
  checks: { name: "test_native.py", content: nativeChecks },
  tasks: [{ id: 1, tests: ["test_checker"] }, { id: 2, tests: ["test_again"] }],
};
const nativeVhdl: TestJobRequest = {
  ...nativeVerilog, runner: "ghdl-native@1", solution: "testbench.vhd",
  files: {
    "testbench.vhd": 'library ieee; use ieee.numeric_std.all; entity testbench is end; architecture sim of testbench is begin process begin wait for 1 ns; report "PASS"; std.env.finish; wait; end process; end;',
    "dut_correct.vhd": "entity dut is end; architecture rtl of dut is begin end;",
  },
  checks: { name: "test_native.py", content: nativeChecks.replaceAll("simulate()", 'simulate("dut_correct.vhd")') },
  sourceOrder: ["dut_correct.vhd", "testbench.vhd"],
};

for (const request of [cocotb, nativeVerilog, nativeVhdl]) {
  test(`${request.runner}: pass, selected task, fail, compile error and timeout`, { timeout: 120_000 }, async () => {
    const pass = await runTestJob(request, { signal });
    assert.equal(pass.report.status, "pass", JSON.stringify(pass.report));
    assert.match(pass.waveform ?? "", /\$enddefinitions/);
    const selected = await runTestJob({ ...request, taskId: 2 }, { signal });
    assert.equal(selected.report.status, "pass", JSON.stringify(selected.report));
    assert.deepEqual(selected.report.tests.map((t) => t.task_id), [2]);
    const goodSource = request.files[request.solution] ?? "";
    const wrongSource = request === cocotb ? vhdl("0") : goodSource.replace("PASS", "FAIL");
    const fail = await runTestJob({ ...request, files: { ...request.files, [request.solution]: wrongSource } }, { signal });
    assert.equal(fail.report.status, "fail", JSON.stringify(fail.report));
    const broken = await runTestJob({ ...request, files: { ...request.files, [request.solution]: "not HDL syntax" } }, { signal });
    assert.equal(broken.report.status, "error", JSON.stringify(broken.report));
    assert.equal(broken.waveform, undefined);
    const stuck: TestJobRequest = request === cocotb
      ? { ...request, checks: { ...request.checks, content: request.checks.content.replace('await Timer(1, unit="ns")', 'while True: pass') } }
      : { ...request, checks: { ...request.checks, content: request.checks.content.replace("result = simulate", "while True: pass\n    result = simulate") } };
    await assert.rejects(runTestJob(stuck, { signal, timeoutMs: 2000 }),
      (error) => error instanceof JobFailure && error.kind === "timeout");
  });
}

const circuit: CircuitJobRequest = {
  runner: "ghdl-yosys-digitaljs@1", top: "top_module", solution: "top_module.vhd",
  files: { "top_module.vhd": vhdl("1") },
};
test("ghdl-yosys-digitaljs@1: pass, unsupported design, compile error and timeout", { timeout: 120_000 }, async () => {
  const pass = await runCircuitJob(circuit, { signal });
  assert.deepEqual(pass.ports, [{ name: "out_value", direction: "output", bits: 1 }]);
  assert.ok(Object.keys(pass.circuit.devices as object).length > 0);
  for (const [source, message] of [
    ["library ieee; use ieee.std_logic_1164.all; entity top_module is port (x: in std_logic_vector(32 downto 0); y: out std_logic_vector(32 downto 0)); end; architecture rtl of top_module is begin y <= x; end;", /ports up to 32 bits/],
    ["entity top_module is invalid syntax", /expected|unexpected|missing/i],
  ] as const) {
    await assert.rejects(runCircuitJob({ ...circuit, files: { "top_module.vhd": source } }, { signal }), (error) => {
      assert.ok(error instanceof JobFailure);
      assert.equal(error.kind, "design");
      assert.match(error.message, message);
      return true;
    });
  }
  // The sandbox deadline covers compilation and synthesis as well as simulation.
  await assert.rejects(runCircuitJob(circuit, { signal, timeoutMs: 1 }),
    (error) => error instanceof JobFailure && error.kind === "timeout");
});
