import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def start(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    await Timer(1, units="ns")
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
async def fault_sticks_until_acknowledged(dut):
    await start(dut)
    dut.fault.value = 1
    dut.acknowledge.value = 0
    await edge(dut)
    dut.fault.value = 0
    await edge(dut)
    eq(dut.alarm, 1, "fault disappeared")
    dut.acknowledge.value = 1
    await edge(dut)
    eq(dut.alarm, 0, "acknowledged")


@cocotb.test()
async def fault_wins_over_acknowledge(dut):
    await start(dut)
    dut.fault.value = 1
    dut.acknowledge.value = 1
    await edge(dut)
    eq(dut.alarm, 1, "simultaneous fault and acknowledgement")
