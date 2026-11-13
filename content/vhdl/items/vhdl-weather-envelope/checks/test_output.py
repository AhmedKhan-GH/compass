import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def test_packed_layout(dut):
    """Packs each named field into its declared wire slice."""
    await Timer(1, unit="ns")
    expected = (((-12) & 255) << 8) | (73 << 1) | 1
    assert int(dut.packed.value) == expected


@cocotb.test()
async def test_round_trip(dut):
    """Unpacks signed and unsigned fields and round-trips a record."""
    await Timer(1, unit="ns")
    cold_value = int(dut.cold_temp.value)
    if cold_value > 2**31:
        cold_value -= 2**32
    assert [cold_value, int(dut.cold_humidity.value), int(dut.cold_valid.value)] == [
        -12,
        73,
        1,
    ]
    assert [
        int(dut.warm_temp.value),
        int(dut.warm_humidity.value),
        int(dut.warm_valid.value),
    ] == [25, 42, 0]
