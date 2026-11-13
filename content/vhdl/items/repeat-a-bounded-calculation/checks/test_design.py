import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def loop_visits_each_bit(dut):
    for v in (0, 1, 0x80, 0x55, 0xFF):
        dut.samples.value = v
        await Timer(1, units="ns")
        a = str(dut.inverted.value)
        e = f"{v ^ 255:08b}"
        assert a == e, f"samples={v:08b}: expected inverted={e}; observed {a}."


@cocotb.test()
async def accumulator_is_initialized_and_wide_enough(dut):
    for v in range(256):
        dut.samples.value = v
        await Timer(1, units="ns")
        a = str(dut.ones.value)
        e = f"{v.bit_count():04b}"
        assert a == e, f"samples={v:08b}: expected ones={e}; observed {a}."
