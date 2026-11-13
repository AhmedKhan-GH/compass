import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def array_lookup_uses_word_indices(dut):
    vals = (0x10, 0x21, 0x32, 0x43, 0x54, 0x65, 0x76, 0x87)
    for a, e in enumerate(vals):
        dut.address.value = a
        await Timer(1, units="ns")
        assert int(dut.data.value) == e, (
            f"address={a}: expected data={e:02x}; observed {dut.data.value}."
        )


@cocotb.test()
async def packed_lookup_uses_bit_offsets(dut):
    vals = (0xEF, 0xCD, 0xAB, 0x89, 0x67, 0x45, 0x23, 0x01)
    for a, e in enumerate(vals):
        dut.address.value = a
        await Timer(1, units="ns")
        assert int(dut.packed_byte.value) == e, (
            f"address={a}: expected packed_byte={e:02x}; observed {dut.packed_byte.value}."
        )
