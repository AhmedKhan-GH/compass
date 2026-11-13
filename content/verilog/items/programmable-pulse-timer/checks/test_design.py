import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def start(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    dut.reset.value = 1
    await RisingEdge(dut.clk)
    await Timer(1, units="ns")
    dut.reset.value = 0


async def edge(dut):
    await RisingEdge(dut.clk)
    await Timer(1, units="ns")


def eq(sig, expected, context):
    actual = str(sig.value)
    assert actual == f"{expected:0{len(sig)}b}", (
        f"{context}: expected {sig._name}={expected:0{len(sig)}b}; observed {actual}."
    )


@cocotb.test()
async def pulse_has_requested_length_and_ignores_restart(dut):
    await start(dut)
    dut.duration.value = 3
    dut.start_pulse.value = 1
    await edge(dut)
    eq(dut.lamp, 1, "accepted start")
    dut.duration.value = 8
    for i in range(2):
        await edge(dut)
        eq(dut.lamp, 1, f"busy edge {i + 1}")
    dut.start_pulse.value = 0
    await edge(dut)
    eq(dut.lamp, 0, "three intervals complete")


@cocotb.test()
async def zero_duration_stays_off(dut):
    await start(dut)
    dut.duration.value = 0
    dut.start_pulse.value = 1
    await edge(dut)
    eq(dut.lamp, 0, "zero-duration start")
