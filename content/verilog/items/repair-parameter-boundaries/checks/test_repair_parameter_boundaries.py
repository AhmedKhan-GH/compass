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


@cocotb.test()
async def smallest_and_non_power_of_two_boundaries(dut):
    """One-bit data holds when disabled and addresses wrap after the third position."""
    dut.reset.value = 1
    dut.en.value = 0
    dut.data_in.value = 0
    cocotb.start_soon(Clock(dut.clk, 10, unit="ns").start())
    await edge(dut)
    dut.reset.value = 0
    for index, value in enumerate([0, 1, 0, 1, 1]):
        dut.en.value = 1
        dut.data_in.value = value
        await edge(dut)
        next_address = (index + 1) % 3
        expect(dut.data_out, value, f"accepted sample {index}")
        expect(dut.addr, next_address, f"address after sample {index}")
        dut.en.value = 0
        dut.data_in.value = 1 - value
        await edge(dut)
        expect(dut.data_out, value, "disabled output holds")
        expect(dut.addr, next_address, "disabled address holds")
    dut.reset.value = 1
    dut.en.value = 1
    dut.data_in.value = 1
    await edge(dut)
    expect(dut.data_out, 0, "reset wins over enable")
    expect(dut.addr, 0, "reset restarts the address sequence")
