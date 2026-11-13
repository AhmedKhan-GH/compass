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
async def pulses_once_per_low_to_high_transition(dut):
    await start(dut)
    for button, expected in ((0, 0), (1, 1), (1, 0), (1, 0), (0, 0), (1, 1), (0, 0)):
        dut.button.value = button
        await edge(dut)
        eq(dut.rise, expected, f"sampled button={button}")
