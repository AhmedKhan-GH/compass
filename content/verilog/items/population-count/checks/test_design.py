import cocotb
from cocotb.triggers import Timer


async def check(dut, lamps, limit):
    dut.lamps.value = lamps
    dut.limit.value = limit
    await Timer(1, unit="ns")
    count = lamps.bit_count()
    assert str(dut.count.value) == f"{count:04b}", (
        f"lamps={lamps:012b}: expected count={count}; observed {dut.count.value}"
    )
    expected = int(count > limit)
    assert str(dut.over_limit.value) == str(expected), (
        f"lamps={lamps:012b}, limit={limit}, count={count}: "
        f"expected over_limit={expected}; observed {dut.over_limit.value}"
    )


@cocotb.test()
async def counts_all_patterns_including_boundaries(dut):
    """Count every lamp pattern and make the independent budget decision."""
    for lamps in range(4096):
        await check(dut, lamps, lamps % 16)


@cocotb.test()
async def equality_and_limit_changes_preserve_the_count(dut):
    """Equality is allowed; changing the limit must not alter the count."""
    for lamps in (0, 1, 0x800, 0x801, 0x555, 0xFFF):
        for limit in range(16):
            await check(dut, lamps, limit)
