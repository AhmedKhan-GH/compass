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
async def output_is_exactly_two_edges_from_input(dut):
    await start(dut)
    for value, expected in ((0x11, 0), (0x22, 0x11), (0xE0, 0x22), (0x00, 0xE0)):
        dut.sample.value = value
        await edge(dut)
        eq(dut.delayed, expected, f"after sampling {value:02x}")
