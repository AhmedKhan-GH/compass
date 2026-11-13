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
async def shift_add_products(dut):
    await start(dut)
    for a, b in [(0, 255), (3, 5), (13, 11), (255, 255)]:
        dut.a.value = a
        dut.b.value = b
        dut.start.value = 1
        await edge(dut)
        dut.start.value = 0
        assert int(dut.busy.value) == 1 and int(dut.done.value) == 0, (
            f"accepted start must set busy and clear done; observed busy={dut.busy.value}, done={dut.done.value}"
        )
        dut.a.value = 17
        dut.b.value = 19
        dut.start.value = 1
        await edge(dut)
        dut.start.value = 0
        for _ in range(7):
            await edge(dut)
        assert int(dut.product.value) == a * b and int(dut.done.value) == 1, (
            f"cycle check: expected int(dut.product.value)==a*b and int(dut.done.value)==1; observed product={dut.product.value}, done={dut.done.value}"
        )
