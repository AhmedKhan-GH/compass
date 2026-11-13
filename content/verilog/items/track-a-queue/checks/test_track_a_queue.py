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
    dut.push.value = 1
    for i in range(5):
        await edge(dut)
        assert int(dut.count.value) == i + 1, (
            f"cycle check: expected int(dut.count.value)==i+1; observed count={dut.count.value}"
        )
    assert int(dut.full.value) == 1, (
        f"cycle check: expected int(dut.full.value)==1; observed full={dut.full.value}"
    )


@cocotb.test()
async def boundary_behavior(dut):
    await start(dut)
    dut.push.value = 1
    for _ in range(5):
        await edge(dut)
    dut.pop.value = 1
    for _ in range(7):
        await edge(dut)
    assert int(dut.count.value) == 4, (
        f"cycle check: expected int(dut.count.value)==4; observed count={dut.count.value}"
    )
    dut.push.value = 0
    for _ in range(4):
        await edge(dut)
    assert (
        int(dut.empty.value) == 1
        and int(dut.write_ptr.value) == 1
        and int(dut.read_ptr.value) == 1
    ), (
        f"cycle check: expected int(dut.empty.value)==1 and int(dut.write_ptr.value)==1 and int(dut.read_ptr.value)==1; observed empty={dut.empty.value}, write_ptr={dut.write_ptr.value}, read_ptr={dut.read_ptr.value}"
    )
    dut.pop.value = 1
    await edge(dut)
    assert int(dut.count.value) == 0 and int(dut.read_ptr.value) == 1, (
        f"empty pop: expected count=0 and read_ptr=1; observed count={dut.count.value}, read_ptr={dut.read_ptr.value}"
    )
