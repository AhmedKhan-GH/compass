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
async def update_pulses_every_four_edges(dut):
    await start(dut)
    for i in range(12):
        await edge(dut)
        eq(dut.update, int(i % 4 == 3), f"edge {i + 1}")


@cocotb.test()
async def consumer_updates_only_at_pulses(dut):
    await start(dut)
    for i in range(9):
        await edge(dut)
        eq(dut.updates, (i + 1) // 4, f"edge {i + 1}")
