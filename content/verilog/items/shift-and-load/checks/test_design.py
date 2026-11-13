import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def start(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    dut.reset.value = 1
    await RisingEdge(dut.clk)
    await Timer(1, units="ns")
    dut.reset.value = 0


async def edge(dut):
    await RisingEdge(dut.clk)
    await Timer(1, units="ns")


def eq(sig, expected, context):
    actual = str(sig.value)
    assert actual == f"{expected:0{len(sig)}b}", (
        f"{context}: expected {sig._name}={expected:0{len(sig)}b}; observed {actual}."
    )


@cocotb.test()
async def parallel_load_and_hold(dut):
    await start(dut)
    dut.load.value = 1
    dut.shift.value = 0
    dut.parallel_in.value = 0x95
    dut.serial_in.value = 0
    await edge(dut)
    eq(dut.pattern, 0x95, "load")
    dut.load.value = 0
    await edge(dut)
    eq(dut.pattern, 0x95, "hold")


@cocotb.test()
async def shifts_and_load_has_priority(dut):
    await start(dut)
    dut.load.value = 1
    dut.shift.value = 1
    dut.parallel_in.value = 0x81
    dut.serial_in.value = 1
    await edge(dut)
    eq(dut.pattern, 0x81, "simultaneous load and shift")
    dut.load.value = 0
    await edge(dut)
    eq(dut.pattern, 0x03, "left shift")
