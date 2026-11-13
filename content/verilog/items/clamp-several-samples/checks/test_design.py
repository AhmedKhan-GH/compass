import cocotb
from cocotb.triggers import Timer


def bits(v):
    return v & 255


def clamp(v):
    return max(-40, min(60, v))


@cocotb.test()
async def clamps_boundaries_and_independent_channels(dut):
    for a, b, c in ((-128, -40, -39), (59, 60, 61), (127, 0, -41), (20, -10, 44)):
        dut.sample_a.value = bits(a)
        dut.sample_b.value = bits(b)
        dut.sample_c.value = bits(c)
        await Timer(1, units="ns")
        for n, v in (("clamped_a", a), ("clamped_b", b), ("clamped_c", c)):
            actual = int(getattr(dut, n).value)
            expected = bits(clamp(v))
            assert actual == expected, (
                f"input {v} at {n}: expected bits {expected:08b}; observed {actual:08b}."
            )
