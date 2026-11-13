import cocotb
from cocotb.triggers import Timer


async def check_output(dut, name, expected):
    for status in range(256):
        for mask in (0, 1, 0x55, 0xAA, 0xFF):
            dut.status.value = status
            dut.mask.value = mask
            await Timer(1, unit="ns")
            value = expected(status, mask)
            assert str(dut[name].value) == f"{value:08b}", (
                f"status={status:08b}, mask={mask:08b}: "
                f"expected {name}={value:08b}; observed {dut[name].value}"
            )


@cocotb.test()
async def inverts_each_position(dut):
    """Every output position is the opposite of its input position."""
    await check_output(dut, "inverted", lambda status, mask: status ^ 255)


@cocotb.test()
async def mask_selects_individual_positions(dut):
    """Each mask bit controls only its corresponding visible status bit."""
    await check_output(dut, "kept", lambda status, mask: status & mask)


@cocotb.test()
async def low_mask_bit_controls_global_toggle(dut):
    """Only mask bit zero chooses whether the whole word is reversed."""
    await check_output(
        dut, "toggled", lambda status, mask: status ^ (255 if mask & 1 else 0)
    )
