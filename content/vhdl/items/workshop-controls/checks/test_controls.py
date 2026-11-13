import cocotb
from cocotb.triggers import Timer


async def check_outputs(dut, button_a, button_b, blocked, available=None, start=None):
    dut.button_a.value = button_a
    dut.button_b.value = button_b
    dut.blocked.value = blocked
    await Timer(1, unit="ns")
    inputs = f"button_a = {button_a}, button_b = {button_b}, blocked = {blocked}"
    for name, expected in (("available", available), ("start", start)):
        if expected is not None:
            actual = str(dut[name].value)
            assert actual == str(expected), (
                f"With {inputs}, expected {name} = {expected}; observed {actual}."
            )


@cocotb.test()
async def availability_is_the_inverse_of_blocked(dut):
    """available is 1 when blocked is 0, regardless of the buttons."""
    for button_a, button_b in ((0, 0), (0, 1), (1, 0), (1, 1)):
        await check_outputs(dut, button_a, button_b, 0, available=1)
        await check_outputs(dut, button_a, button_b, 1, available=0)
        await check_outputs(dut, button_a, button_b, 0, available=1)


@cocotb.test()
async def first_button_requires_availability(dut):
    """With button_b at 0, start is 1 only for button_a=1 and blocked=0."""
    for button_a, blocked, expected in ((0, 0, 0), (1, 0, 1), (1, 1, 0), (0, 1, 0)):
        await check_outputs(dut, button_a, 0, blocked, start=expected)


@cocotb.test()
async def either_button_can_request_start(dut):
    """With blocked at 0, pressing either button sets start to 1."""
    for button_a, button_b, expected in ((0, 0, 0), (0, 1, 1), (1, 0, 1), (1, 1, 1)):
        await check_outputs(dut, button_a, button_b, 0, start=expected)


@cocotb.test()
async def blocking_applies_to_both_buttons(dut):
    """With blocked at 1, start stays 0 for every button combination."""
    for button_a, button_b in ((0, 0), (0, 1), (1, 0), (1, 1)):
        await check_outputs(dut, button_a, button_b, 1, available=0, start=0)


@cocotb.test()
async def both_outputs_follow_changing_inputs(dut):
    """available and start update when buttons or blocked change."""
    for row in (
        (0, 0, 0, 1, 0),
        (0, 1, 0, 1, 1),
        (0, 1, 1, 0, 0),
        (0, 1, 0, 1, 1),
        (0, 0, 0, 1, 0),
        (1, 0, 0, 1, 1),
        (1, 0, 1, 0, 0),
        (1, 1, 1, 0, 0),
        (1, 1, 0, 1, 1),
        (0, 0, 0, 1, 0),
    ):
        await check_outputs(dut, *row)
