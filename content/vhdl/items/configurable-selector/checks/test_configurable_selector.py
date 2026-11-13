import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def both_widths(dut):
    for blank in (0, 1):
        for sel in (0, 1):
            for a, b in ((0, 0), (1, 7), (0x55, 0xAA), (0xFF, 0x31)):
                dut.a8.value = a
                dut.b8.value = b
                dut.sel8.value = sel
                dut.blank8.value = blank
                dut.a3.value = a & 7
                dut.b3.value = b & 7
                dut.sel3.value = sel
                dut.blank3.value = blank
                await Timer(1, unit="ns")
                assert int(dut.out8.value) == (0 if blank else (b if sel else a))
                assert int(dut.out3.value) == (0 if blank else ((b if sel else a) & 7))
