import subprocess
import tempfile
from pathlib import Path

import cocotb
from cocotb.triggers import Timer


SOLUTION = Path("/solution")


def probe(program, modules=(), defines=()):
    """Compile an independent instance using the learner's submitted files."""
    with tempfile.TemporaryDirectory(prefix="trail-kit-") as folder:
        folder = Path(folder)
        source = folder / "probe.v"
        source.write_text(program)
        binary = folder / "probe"
        command = [
            "iverilog",
            "-g2005",
            "-I",
            str(SOLUTION),
            "-s",
            "probe",
            "-o",
            str(binary),
        ]
        command += ["-D" + definition for definition in defines]
        command += [str(SOLUTION / module) for module in modules]
        command += [str(source)]
        compiled = subprocess.run(command, text=True, capture_output=True, timeout=2)
        assert compiled.returncode == 0, (
            "The independent module must compile:\n" + compiled.stderr
        )
        executed = subprocess.run(
            ["vvp", str(binary)], text=True, capture_output=True, timeout=2
        )
        assert executed.returncode == 0, executed.stdout + executed.stderr
        assert (
            "PROBE_PASS" in executed.stdout and "PROBE_FAIL" not in executed.stdout
        ), executed.stdout


def counter_program(width):
    return """
`timescale 1ns / 1ps
module probe;
    reg clk = 0;
    reg reset = 1;
    reg arrival = 1;
    wire [%d:0] visitors;
    integer expected = 0;
    integer i;
    integer errors = 0;
    trail_counter #(.WIDTH(%d)) counter (clk, reset, arrival, visitors);
    task cycle;
        begin
            clk = 0; #1;
            clk = 1; #1;
            if (visitors !== expected) begin
                errors = errors + 1;
                $display("PROBE_FAIL count expected=%%0d actual=%%0d", expected, visitors);
            end
            clk = 0; #1;
        end
    endtask
    initial begin
        cycle;
        reset = 0;
        for (i = 0; i < %d; i = i + 1) begin
            arrival = (i %% 4 != 2);
            if (arrival) expected = (expected + 1) %% %d;
            cycle;
        end
        arrival = 1;
        reset = 1;
        #1;
        if (visitors !== expected) begin
            errors = errors + 1;
            $display("PROBE_FAIL reset changed count before a rising edge");
        end
        expected = 0;
        cycle;
        if (errors == 0) $display("PROBE_PASS");
        $finish;
    end
endmodule
""" % (width - 1, width, (1 << width) * 2 + 3, 1 << width)


def indicator_program(width, threshold):
    return """
`timescale 1ns / 1ps
module probe;
    reg [%d:0] visitors = 0;
    wire busy;
    integer value;
    integer errors = 0;
    trail_indicator #(.WIDTH(%d), .WARNING_AT(%d)) sign (visitors, busy);
    initial begin
        for (value = 0; value < %d; value = value + 1) begin
            visitors = value;
            #1;
            if (busy !== (value >= %d)) begin
                errors = errors + 1;
                $display("PROBE_FAIL count=%%0d busy=%%b", value, busy);
            end
        end
        visitors = 0; #1;
        if (busy !== (%d == 0)) errors = errors + 1;
        if (errors == 0) $display("PROBE_PASS");
        else $display("PROBE_FAIL sign errors=%%0d", errors);
        $finish;
    end
endmodule
""" % (width - 1, width, threshold, 1 << width, threshold, threshold)


@cocotb.test()
async def shared_header_preserves_build_choices(dut):
    """Use an 8-bit default, preserve an explicit 5-bit choice, and allow repeated inclusion."""
    for expected, defines in [(8, ()), (5, ("TRAIL_COUNT_WIDTH=5",))]:
        probe(
            """
`include "trail_defs.vh"
`include "trail_defs.vh"
module probe;
    initial begin
        if (`TRAIL_COUNT_WIDTH == %d) $display("PROBE_PASS");
        else $display("PROBE_FAIL shared width should be %d, got %%0d", `TRAIL_COUNT_WIDTH);
        $finish;
    end
endmodule
"""
            % (expected, expected),
            defines=defines,
        )
    await Timer(1, unit="ns")


@cocotb.test()
async def reusable_counter_resets_holds_and_wraps(dut):
    """Independently count arrivals at 1, 4, and 8 bits, including hold, wrap, and reset priority."""
    for width in (1, 4, 8):
        probe(counter_program(width), modules=("counter.v",))
    await Timer(1, unit="ns")


@cocotb.test()
async def reusable_indicator_checks_each_threshold(dut):
    """Independently check the sign below, at, and above several configured thresholds."""
    for width, threshold in [(1, 1), (4, 0), (4, 6), (4, 11), (8, 170)]:
        probe(indicator_program(width, threshold), modules=("indicator.v",))
    await Timer(1, unit="ns")


@cocotb.test()
async def assembled_kits_keep_their_configuration(dut):
    """Connect the live kit, then build another kit with a 5-bit default and threshold 17."""
    assert len(dut.visitors) == 8, "The standard entrance kit has an 8-bit display."
    dut.clk.value = 0
    dut.reset.value = 1
    dut.arrival.value = 1
    await Timer(1, unit="ns")
    dut.clk.value = 1
    await Timer(1, unit="ns")
    assert int(dut.visitors.value) == 0 and int(dut.busy.value) == 0, (
        "Reset starts an empty count and clears the milestone lamp."
    )
    dut.reset.value = 0
    expected = 0
    for step in range(350):
        dut.clk.value = 0
        arrival = step % 5 != 3
        dut.arrival.value = int(arrival)
        await Timer(1, unit="ns")
        assert int(dut.visitors.value) == expected, (
            "The displayed count changed between rising edges."
        )
        dut.clk.value = 1
        expected = (expected + int(arrival)) % 256
        await Timer(1, unit="ns")
        assert int(dut.visitors.value) == expected, (
            f"Displayed arrivals: expected {expected}, got {dut.visitors.value}."
        )
        assert int(dut.busy.value) == int(expected >= 6), (
            f"At count {expected}, the milestone lamp should use threshold 6."
        )
    program = (
        counter_program(5)
        .replace(
            "trail_counter #(.WIDTH(5)) counter (clk, reset, arrival, visitors);",
            "wire busy;\n    top_module #(.WARNING_AT(17)) kit (clk, reset, arrival, visitors, busy);",
        )
        .replace(
            "clk = 0; #1;\n        end",
            'if (busy !== (expected >= 17)) begin errors = errors + 1; $display("PROBE_FAIL threshold override"); end\n            clk = 0; #1;\n        end',
        )
    )
    probe(
        program,
        modules=("top_module.v", "counter.v", "indicator.v"),
        defines=("TRAIL_COUNT_WIDTH=5",),
    )
