import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def edge(d):
    await RisingEdge(d.clk)
    await Timer(1, units="ns")


@cocotb.test()
async def synchronous_reset_waits_for_edge(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    await Timer(1, units="ns")
    dut.sync_reset.value = 0
    dut.async_reset.value = 0
    dut.data.value = 9
    await edge(dut)
    dut.sync_reset.value = 1
    await Timer(2, units="ns")
    assert int(dut.sync_value.value) == 9, (
        f"before edge expected sync_value=9; observed {dut.sync_value.value}."
    )
    await edge(dut)
    assert int(dut.sync_value.value) == 0


@cocotb.test()
async def asynchronous_reset_clears_immediately(dut):
    cocotb.start_soon(Clock(dut.clk, 10, units="ns").start())
    await Timer(1, units="ns")
    dut.sync_reset.value = 0
    dut.async_reset.value = 0
    dut.data.value = 12
    await edge(dut)
    assert int(dut.async_value.value) == 12, (
        f"after data edge expected async_value=12; observed {dut.async_value.value}."
    )
    dut.async_reset.value = 1
    await Timer(1, units="ns")
    assert int(dut.async_value.value) == 0, (
        f"without waiting for edge expected async_value=0; observed {dut.async_value.value}."
    )
