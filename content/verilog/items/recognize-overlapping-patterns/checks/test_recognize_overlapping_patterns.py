import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def start(dut):
    cocotb.start_soon(Clock(dut.clk, 10, unit="ns").start())
    dut.reset.value = 1
    for name in (
        "write_en",
        "sample_valid",
        "en",
        "request",
        "clear",
        "request_a",
        "request_b",
        "alarm",
        "acknowledge",
        "bit_in",
        "advance",
        "start",
        "in_valid",
        "out_ready",
        "push",
        "pop",
        "valid",
    ):
        if hasattr(dut, name):
            getattr(dut, name).value = 0
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")
    dut.reset.value = 0


async def edge(dut):
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")


@cocotb.test()
async def overlapping_matches(dut):
    await start(dut)
    got = []
    for b in [1, 0, 1, 0, 1]:
        dut.bit_in.value = b
        await edge(dut)
        got.append(int(dut.match.value))
    expected = [0, 0, 1, 0, 1]
    assert got == expected, (
        f"stream 10101: expected match pulses {expected}; observed {got}"
    )
