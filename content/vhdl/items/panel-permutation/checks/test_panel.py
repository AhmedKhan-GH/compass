import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def each_input_reaches_one_lamp(dut):
    """Each input bit reaches its specified lamp without lighting others."""
    for input_bit, output_bit in enumerate((4, 5, 6, 7, 2, 3, 1, 0)):
        value = 1 << input_bit
        dut.status.value = value
        await Timer(1, unit="ns")
        expected = f"{1 << output_bit:08b}"
        actual = str(dut.lamps.value)
        assert actual == expected, (
            f"Only status[{input_bit}] is 1 (status={value:08b}): "
            f"expected lamps={expected}; observed {actual}."
        )


@cocotb.test()
async def all_words_preserve_the_connections(dut):
    """All 256 words preserve the mapping, including repeated changes."""
    for value in (*range(256), 0, 255, 128, 64, 177, 1, 0):
        dut.status.value = value
        await Timer(1, unit="ns")
        # Source bit for each output position, from lamps[7] to lamps[0].
        expected = "".join(str((value >> bit) & 1) for bit in (3, 2, 1, 0, 5, 4, 6, 7))
        actual = str(dut.lamps.value)
        assert actual == expected, (
            f"status={value:08b}: expected lamps={expected}; observed {actual}."
        )
