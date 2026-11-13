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
async def interlock_and_priority(dut):
    await start(dut)
    dut.request_a.value = 1
    dut.request_b.value = 1
    await edge(dut)
    assert int(dut.permit_a.value) == 1 and int(dut.permit_b.value) == 0, (
        f"cycle check: expected int(dut.permit_a.value)==1 and int(dut.permit_b.value)==0; observed permit_a={dut.permit_a.value}, permit_b={dut.permit_b.value}"
    )
    dut.request_a.value = 0
    await edge(dut)
    await edge(dut)
    assert int(dut.permit_b.value) == 1, (
        f"cycle check: expected int(dut.permit_b.value)==1; observed permit_b={dut.permit_b.value}"
    )
