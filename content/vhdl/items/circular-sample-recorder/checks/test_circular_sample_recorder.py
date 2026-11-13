import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


def expect(signal, expected, context):
    observed = signal.value
    assert observed.is_resolvable, (
        f"{context}: expected {expected}; observed {observed}"
    )
    assert int(observed) == expected, (
        f"{context}: expected {expected}; observed {int(observed)}"
    )


async def edge(dut):
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")


async def check_window(dut, newest_first):
    expect(dut.count, len(newest_first), "number of retained samples")
    for age in range(8):
        dut.age.value = age
        await Timer(0.1, unit="ns")
        expected = newest_first[age] if age < len(newest_first) else 0
        expect(dut.sample_out, expected, f"age {age}, retained {newest_first}")


@cocotb.test()
async def recorder_wraps_and_orders(dut):
    """Retain newest samples, hold without a request, wrap, and discard history on reset."""
    dut.reset.value = 1
    dut.sample_valid.value = 0
    dut.sample_data.value = 0
    dut.age.value = 0
    cocotb.start_soon(Clock(dut.clk, 10, unit="ns").start())
    await edge(dut)
    dut.reset.value = 0
    await check_window(dut, [])
    window = []
    for value in range(1, 8):
        dut.sample_valid.value = 1
        dut.sample_data.value = value
        await edge(dut)
        window = ([value] + window)[:5]
        await check_window(dut, window)
        dut.sample_valid.value = 0
        dut.sample_data.value = 0xEE
        await edge(dut)
        await check_window(dut, window)
    dut.reset.value = 1
    dut.sample_valid.value = 1
    await edge(dut)
    await check_window(dut, [])
    dut.reset.value = 0
    dut.sample_data.value = 0xA5
    await edge(dut)
    dut.sample_valid.value = 0
    await check_window(dut, [0xA5])
