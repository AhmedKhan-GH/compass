import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def function_handles_zero_and_full_scale(dut):
    for v in (0, 1, 0x55, 0x80, 0xFF):
        dut.channel_a.value = v
        dut.channel_b.value = 0
        dut.channel_c.value = 0
        await Timer(1, units="ns")
        assert int(dut.count_a.value) == v.bit_count(), (
            f"channel_a={v:08b}: expected count={v.bit_count()}; observed {dut.count_a.value}."
        )


@cocotb.test()
async def calls_are_independent(dut):
    for a, b, c in ((1, 3, 7), (0xFF, 0, 0x81), (0x55, 0xAA, 0xF0)):
        dut.channel_a.value = a
        dut.channel_b.value = b
        dut.channel_c.value = c
        await Timer(1, units="ns")
        for n, v in (("count_a", a), ("count_b", b), ("count_c", c)):
            assert int(getattr(dut, n).value) == v.bit_count(), (
                f"{n}: expected {v.bit_count()}; observed {getattr(dut, n).value}."
            )
