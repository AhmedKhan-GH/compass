import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def start(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    await Timer(1, units="ns")
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
async def loads_and_holds(dut):
    await start(dut)
    dut.freeze.value = 0
    dut.load.value = 1
    dut.data.value = 0x5A
    await edge(dut)
    eq(dut.value, 0x5A, "load")
    dut.load.value = 0
    dut.data.value = 3
    await edge(dut)
    eq(dut.value, 0x5A, "hold")


@cocotb.test()
async def reset_then_freeze_then_load_priority(dut):
    await start(dut)
    dut.load.value = 1
    dut.freeze.value = 0
    dut.data.value = 0x33
    await edge(dut)
    dut.freeze.value = 1
    dut.data.value = 0x77
    await edge(dut)
    eq(dut.value, 0x33, "frozen load")
    dut.reset.value = 1
    await edge(dut)
    eq(dut.value, 0, "reset while frozen")
