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
async def basic_behavior(dut):
    await start(dut)
    assert int(dut.stop.value) == 1, (
        f"cycle check: expected int(dut.stop.value)==1; observed stop={dut.stop.value}"
    )
    await edge(dut)
    assert int(dut.stop.value) == 1, (
        f"STOP without request must hold; observed stop={dut.stop.value}"
    )
    dut.request.value = 1
    await edge(dut)
    assert int(dut.go.value) == 1, (
        f"cycle check: expected int(dut.go.value)==1; observed go={dut.go.value}"
    )
    dut.request.value = 0
    await edge(dut)
    assert int(dut.go.value) == 1, (
        f"GO without clear must hold; observed go={dut.go.value}"
    )
    dut.clear.value = 1
    await edge(dut)
    assert int(dut.caution.value) == 1, (
        f"cycle check: expected int(dut.caution.value)==1; observed caution={dut.caution.value}"
    )
    await edge(dut)
    assert int(dut.stop.value) == 1, (
        f"cycle check: expected int(dut.stop.value)==1; observed stop={dut.stop.value}"
    )


@cocotb.test()
async def boundary_behavior(dut):
    await start(dut)
    dut.request.value = 1
    await edge(dut)
    dut.reset.value = 1
    await edge(dut)
    assert int(dut.stop.value) == 1, (
        f"cycle check: expected int(dut.stop.value)==1; observed stop={dut.stop.value}"
    )
