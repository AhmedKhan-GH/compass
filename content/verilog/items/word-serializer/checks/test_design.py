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
async def emits_msb_first_then_stops(dut):
    await start(dut)
    dut.word.value = 0xB2
    dut.load.value = 1
    await edge(dut)
    for i, expected in enumerate((1, 0, 1, 1, 0, 0, 1, 0)):
        eq(dut.bit_out, expected, f"bit {7 - i}")
        eq(dut.busy, 1, f"bit {7 - i}")
        if i < 7:
            dut.load.value = 0
            await edge(dut)
    dut.load.value = 0
    await edge(dut)
    eq(dut.busy, 0, "after word")
    eq(dut.bit_out, 0, "idle")
