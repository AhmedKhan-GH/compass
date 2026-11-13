import cocotb
from cocotb.triggers import Timer


def require_ports(dut):
    assert hasattr(dut, "input_signal"), (
        "The model needs a one-bit input port named input_signal. "
        "Add it to the entity's port list before testing its behavior."
    )
    assert len(dut["input_signal"]) == 1, "The input input_signal must be one bit wide."
    assert hasattr(dut, "output_signal"), (
        "The model needs a one-bit output port named output_signal. "
        "Add it to the entity's port list before testing its behavior."
    )
    assert len(dut["output_signal"]) == 1, "The output output_signal must be one bit wide."
    return dut["input_signal"], dut["output_signal"]


@cocotb.test()
async def switch_ports_are_one_bit(dut):
    """The switch and lightbox have named one-bit connections."""
    require_ports(dut)


@cocotb.test()
async def output_follows_input(dut):
    """The lightbox follows the switch through repeated changes."""
    switch, light = require_ports(dut)
    for value in (0, 1, 0, 1):
        switch.value = value
        await Timer(1, unit="ns")
        actual = str(light.value)
        assert actual == str(value), (
            f"With input_signal = {value}, expected output_signal = {value}; observed {actual}."
        )
