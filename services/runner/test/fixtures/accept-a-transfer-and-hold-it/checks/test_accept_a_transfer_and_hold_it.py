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
    dut.in_valid.value = 1
    dut.in_data.value = 42
    dut.out_ready.value = 0
    await edge(dut)
    assert int(dut.out_valid.value) == 1 and int(dut.out_data.value) == 42, (
        f"cycle check: expected int(dut.out_valid.value)==1 and int(dut.out_data.value)==42; observed out_valid={dut.out_valid.value}, out_data={dut.out_data.value}"
    )


@cocotb.test()
async def boundary_behavior(dut):
    await start(dut)
    dut.in_valid.value = 1
    dut.in_data.value = 9
    await edge(dut)
    dut.in_data.value = 10
    assert int(dut.in_ready.value) == 0, (
        f"cycle check: expected int(dut.in_ready.value)==0; observed in_ready={dut.in_ready.value}"
    )
    await edge(dut)
    assert int(dut.out_data.value) == 9, (
        f"cycle check: expected int(dut.out_data.value)==9; observed out_data={dut.out_data.value}"
    )
    dut.out_ready.value = 1
    await edge(dut)
    assert int(dut.out_data.value) == 10, (
        f"cycle check: expected int(dut.out_data.value)==10; observed out_data={dut.out_data.value}"
    )
