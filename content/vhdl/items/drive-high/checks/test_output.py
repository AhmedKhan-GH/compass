import cocotb
from cocotb.triggers import Timer


def require_output(dut):
    assert hasattr(dut, "output_signal"), (
        "The model needs a one-bit output port named output_signal. "
        "Add it to the entity's port list before testing its behavior."
    )
    assert len(dut["output_signal"]) == 1, "The output output_signal must be one bit wide."
    return dut["output_signal"]


@cocotb.test()
async def output_port_is_one_bit(dut):
    """The indicator has a named one-bit output."""
    require_output(dut)


@cocotb.test()
async def output_is_high(dut):
    """The indicator is on after settling."""
    output = require_output(dut)
    await Timer(1, unit="ns")
    actual = str(output.value)
    assert actual == "1", f"Expected output_signal = 1 after settling; observed {actual}."


@cocotb.test()
async def output_stays_high(dut):
    """The indicator stays on over time."""
    output = require_output(dut)
    for _ in range(3):
        await Timer(5, unit="ns")
        actual = str(output.value)
        assert actual == "1", f"Expected output_signal to stay 1; observed {actual}."
