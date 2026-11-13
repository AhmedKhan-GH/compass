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
    dut.alarm.value = 1
    await Timer(1, unit="ns")
    assert (
        int(dut.immediate_warning.value) == 1 and int(dut.stored_warning.value) == 0
    ), (
        f"cycle check: expected int(dut.immediate_warning.value)==1 and int(dut.stored_warning.value)==0; observed immediate_warning={dut.immediate_warning.value}, stored_warning={dut.stored_warning.value}"
    )
    await edge(dut)
    assert int(dut.stored_warning.value) == 1, (
        f"cycle check: expected int(dut.stored_warning.value)==1; observed stored_warning={dut.stored_warning.value}"
    )


@cocotb.test()
async def boundary_behavior(dut):
    await start(dut)
    dut.alarm.value = 1
    await edge(dut)
    dut.alarm.value = 0
    assert int(dut.stored_warning.value) == 1, (
        f"cycle check: expected int(dut.stored_warning.value)==1; observed stored_warning={dut.stored_warning.value}"
    )
    dut.acknowledge.value = 1
    dut.alarm.value = 1
    await edge(dut)
    assert int(dut.stored_warning.value) == 0, (
        f"acknowledge must clear even with alarm high; observed stored_warning={dut.stored_warning.value}"
    )
