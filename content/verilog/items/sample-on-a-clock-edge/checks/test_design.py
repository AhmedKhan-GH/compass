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
async def captures_only_on_rising_edges(dut):
    await start(dut)
    dut.sample.value = 0x35
    await Timer(3, units="ns")
    eq(dut.captured, 0, "before edge")
    await edge(dut)
    eq(dut.captured, 0x35, "after edge")


@cocotb.test()
async def previous_uses_pre_edge_value(dut):
    await start(dut)
    dut.sample.value = 0x12
    await edge(dut)
    dut.sample.value = 0xA7
    await edge(dut)
    eq(dut.captured, 0xA7, "second edge")
    eq(dut.previous, 0x12, "second edge history")
