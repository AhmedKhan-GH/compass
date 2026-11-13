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
async def natural_counter_wraps_at_width(dut):
    await start(dut)
    dut.enable.value = 1
    for i in range(9):
        await edge(dut)
        eq(dut.natural_count, (i + 1) % 8, f"enabled edge {i + 1}")


@cocotb.test()
async def bounded_counter_wraps_at_six_and_holds(dut):
    await start(dut)
    dut.enable.value = 1
    for i in range(7):
        await edge(dut)
        eq(dut.six_count, (i + 1) % 6, f"enabled edge {i + 1}")
    dut.enable.value = 0
    before = int(dut.six_count.value)
    await edge(dut)
    eq(dut.six_count, before, "disabled edge")
