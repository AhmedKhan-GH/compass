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
async def interface_width_and_latency(dut):
    await start(dut)
    for valid, sample, expv, exp in [(1, 7, 1, 14), (0, 99, 0, 14), (1, 200, 1, 144)]:
        dut.valid.value = valid
        dut.sample.value = sample
        await edge(dut)
        assert int(dut.out_valid.value) == expv and int(dut.scaled.value) == exp, (
            f"cycle check: expected int(dut.out_valid.value)==expv and int(dut.scaled.value)==exp; observed out_valid={dut.out_valid.value}, scaled={dut.scaled.value}"
        )
    dut.reset.value = 1
    await edge(dut)
    assert int(dut.out_valid.value) == 0 and int(dut.scaled.value) == 0, (
        f"cycle check: expected int(dut.out_valid.value)==0 and int(dut.scaled.value)==0; observed out_valid={dut.out_valid.value}, scaled={dut.scaled.value}"
    )
