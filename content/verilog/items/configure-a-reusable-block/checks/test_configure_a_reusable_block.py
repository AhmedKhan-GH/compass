import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def configured_outputs(dut):
    for d8 in (0, 1, 0x5A, 0xFF):
        for d3 in range(8):
            dut.data8.value = d8
            dut.data3.value = d3
            dut.clear8.value = 0
            dut.clear3.value = 0
            await Timer(1, unit="ns")
            assert int(dut.shown8.value) == d8
            assert int(dut.shown3.value) == d3
            dut.clear8.value = 1
            dut.clear3.value = 1
            await Timer(1, unit="ns")
            assert int(dut.shown8.value) == 0xA5
            assert int(dut.shown3.value) == 5


@cocotb.test()
async def nonzero_matches_shown(dut):
    for c in (0, 1):
        dut.data8.value = 0
        dut.data3.value = 0
        dut.clear8.value = c
        dut.clear3.value = c
        await Timer(1, unit="ns")
        assert int(dut.nz8.value) == (1 if c else 0)
        assert int(dut.nz3.value) == (1 if c else 0)
