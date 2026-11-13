import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def complete_combinational_behavior(dut):
    """Changing or disabling a selected display word must never retain old data."""
    # Begin with a definite selected word, then disable it. This exposes a latch
    # through an actual retained value, rather than failing on an uninitialized X.
    cases = [
        (1, 0, 0x12, 0xA4),
        (0, 0, 0x12, 0xA4),
        (0, 1, 0x39, 0xB7),
        (1, 1, 0x39, 0xB7),
        (1, 1, 0x39, 0xE2),
        (0, 1, 0x39, 0xE2),
        (1, 0, 0x5A, 0x00),
        (1, 0, 0xC3, 0x00),
        (1, 1, 0xC3, 0x00),
        (0, 0, 0xFF, 0xFF),
    ]
    for enable, select, a, b in cases:
        dut.enable.value = enable
        dut.select_input.value = select
        dut.a.value = a
        dut.b.value = b
        await Timer(1, unit="ns")
        expected = (b if select else a) if enable else 0
        observed = str(dut.y.value).lower()
        assert observed == format(expected, "08b"), (
            f"enable={enable}, select={select}, a=0x{a:02x}, b=0x{b:02x}: "
            f"expected y=0x{expected:02x}; observed bits {observed}."
        )
