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
async def measures_events_and_pulses_done(dut):
    await start(dut)
    dut.active.value = 1
    for _ in range(3):
        await edge(dut)
    dut.active.value = 0
    await edge(dut)
    eq(dut.duration, 3, "three-cycle event")
    eq(dut.done, 1, "event end")
    await edge(dut)
    eq(dut.done, 0, "following edge")


@cocotb.test()
async def saturates_long_events(dut):
    await start(dut)
    dut.active.value = 1
    for _ in range(18):
        await edge(dut)
    dut.active.value = 0
    await edge(dut)
    eq(dut.duration, 15, "long event")
