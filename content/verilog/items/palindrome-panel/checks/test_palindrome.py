import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def all_symmetric_patterns_are_recognized(dut):
    """Recognize all 16 symmetric eight-bit patterns, including leading zeroes."""
    for value in range(256):
        pattern = f"{value:08b}"
        if pattern != pattern[::-1]:
            continue
        dut.panel.value = value
        await Timer(1, unit="ns")
        actual = str(dut.mirrored.value)
        assert actual == "1", (
            f"panel={pattern} equals its reversal: expected mirrored=1; observed {actual}."
        )


@cocotb.test()
async def every_mismatch_is_rejected(dut):
    """Reject all 240 patterns with at least one mismatched pair."""
    for value in range(256):
        pattern = f"{value:08b}"
        if pattern == pattern[::-1]:
            continue
        dut.panel.value = value
        await Timer(1, unit="ns")
        actual = str(dut.mirrored.value)
        assert actual == "0", (
            f"panel={pattern} differs from its reversal {pattern[::-1]}: "
            f"expected mirrored=0; observed {actual}."
        )


@cocotb.test()
async def recognize_current_pattern_after_changes(dut):
    """Update after transitions in both directions without retaining an answer."""
    for value in (0, 1, 129, 137, 24, 16, 102, 170, 255, 128, 0):
        pattern = f"{value:08b}"
        dut.panel.value = value
        await Timer(1, unit="ns")
        expected = "1" if pattern == pattern[::-1] else "0"
        actual = str(dut.mirrored.value)
        assert actual == expected, (
            f"After changing panel to {pattern}: expected mirrored={expected}; observed {actual}."
        )
