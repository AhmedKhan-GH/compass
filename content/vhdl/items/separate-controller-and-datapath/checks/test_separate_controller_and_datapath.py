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
    dut.amount.value = 3
    dut.start.value = 1
    await edge(dut)
    dut.start.value = 0
    assert int(dut.busy.value) == 1, (
        f"cycle check: expected int(dut.busy.value)==1; observed busy={dut.busy.value}"
    )
    dut.amount.value = 9
    dut.start.value = 1
    await edge(dut)
    dut.start.value = 0
    for _ in range(2):
        await edge(dut)
    assert (
        int(dut.dispensed.value) == 3
        and int(dut.done.value) == 1
        and int(dut.busy.value) == 0
    ), (
        f"cycle check: expected int(dut.dispensed.value)==3 and int(dut.done.value)==1 and int(dut.busy.value)==0; observed dispensed={dut.dispensed.value}, done={dut.done.value}, busy={dut.busy.value}"
    )


@cocotb.test()
async def boundary_behavior(dut):
    await start(dut)
    dut.amount.value = 0
    dut.start.value = 1
    await edge(dut)
    assert int(dut.done.value) == 1 and int(dut.busy.value) == 0, (
        f"cycle check: expected int(dut.done.value)==1 and int(dut.busy.value)==0; observed done={dut.done.value}, busy={dut.busy.value}"
    )
    dut.amount.value = 4
    await edge(dut)
    dut.start.value = 0
    dut.reset.value = 1
    await edge(dut)
    assert (
        int(dut.busy.value) == 0
        and int(dut.done.value) == 0
        and int(dut.dispensed.value) == 0
    ), (
        f"reset must cancel work and clear outputs; observed busy={dut.busy.value}, done={dut.done.value}, dispensed={dut.dispensed.value}"
    )
