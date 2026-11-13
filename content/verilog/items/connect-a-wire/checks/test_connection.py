import cocotb
from cocotb.triggers import Timer


def require_ports(dut):
    assert hasattr(dut, "in"), (
        "The model needs a one-bit input port named in. "
        "Add it to the module's port list before testing its behavior."
    )
    assert len(dut["in"]) == 1, "The input in must be one bit wide."
    assert hasattr(dut, "out"), (
        "The model needs a one-bit output port named out. "
        "Add it to the module's port list before testing its behavior."
    )
    assert len(dut["out"]) == 1, "The output out must be one bit wide."
    return dut["in"], dut["out"]


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
            f"With in = {value}, expected out = {value}; observed {actual}."
        )
