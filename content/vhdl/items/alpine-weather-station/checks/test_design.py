import cocotb
from cocotb.triggers import Timer


async def sample(dut, degrees, correction, metadata=0):
    dut.packet.value = (metadata << 8) | (degrees & 0xFF)
    dut.calibration.value = correction
    await Timer(1, unit="ns")


def expect(signal, expected, context):
    bits = format(expected & ((1 << len(signal)) - 1), f"0{len(signal)}b")
    actual = str(signal.value).lower()
    assert actual == bits, (
        f"{context}: expected signed value {expected} ({bits}); observed {actual}."
    )


@cocotb.test()
async def packet_fields_preserve_negative_readings(dut):
    """Recover every signed temperature independently of radio metadata."""
    for degrees in range(-128, 128):
        for metadata in (0, 0xA5, 0xFF):
            await sample(dut, degrees, 0, metadata)
            expect(dut.temperature, degrees,
                   f"Reading {degrees}, metadata 0x{metadata:02x}")


@cocotb.test()
async def calibration_is_always_nonnegative(dut):
    """Add signed readings to unsigned corrections across every boundary."""
    for degrees in range(-128, 128):
        for correction in (0, 1, 2, 63, 127, 128, 129, 254, 255,
                           (degrees * 37 + 19) & 0xFF):
            await sample(dut, degrees, correction, 0x81)
            expect(dut.calibrated_temperature, degrees + correction,
                   f"Reading {degrees}, correction +{correction}")


@cocotb.test()
async def display_conversion_keeps_the_full_product(dut):
    """The display retains sign and magnitude in thousandths of a degree."""
    for degrees in range(-128, 128):
        for correction in (0, 1, 127, 128, 255, (degrees * 53 + 7) & 0xFF):
            await sample(dut, degrees, correction, 0x5A)
            expect(dut.display_millidegrees, (degrees + correction) * 1000,
                   f"Reading {degrees}, correction +{correction}")
