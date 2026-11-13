import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def test_bounds(dut):
    """Preserves nonzero ascending and descending bounds."""
    await Timer(1, unit="ns")
    assert [
        int(dut.asc_left.value),
        int(dut.asc_right.value),
        int(dut.asc_len.value),
    ] == [3, 5, 3]
    assert [
        int(dut.desc_left.value),
        int(dut.desc_right.value),
        int(dut.desc_len.value),
    ] == [7, 4, 4]


@cocotb.test()
async def test_totals(dut):
    """Visits every element through the object's range."""
    await Timer(1, unit="ns")
    assert int(dut.asc_total.value) == 20 and int(dut.desc_total.value) == 18
