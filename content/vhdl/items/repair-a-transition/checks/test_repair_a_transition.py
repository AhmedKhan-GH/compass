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
async def every_transition_and_reset(dut):
    await start(dut)
    dut.advance.value = 0
    await edge(dut)
    assert int(dut.state.value) == 0, (
        f"advance=0 must hold state 0; observed state={dut.state.value}"
    )
    dut.advance.value = 1
    for exp in [1, 2, 0, 1]:
        await edge(dut)
        assert int(dut.state.value) == exp, (
            f"cycle check: expected int(dut.state.value)==exp; observed state={dut.state.value}"
        )
    dut.reset.value = 1
    await edge(dut)
    assert int(dut.state.value) == 0, (
        f"cycle check: expected int(dut.state.value)==0; observed state={dut.state.value}"
    )
