import cocotb
from cocotb.triggers import Timer


async def settle():
    await Timer(1, units="ns")


@cocotb.test()
async def connected_has_a_definite_driver(dut):
    for v in (0, 1, 0):
        dut.source.value = v
        dut.left.value = 0
        dut.right.value = 0
        await settle()
        assert str(dut.connected.value) == str(v), (
            f"source={v}: expected connected={v}; observed {dut.connected.value}."
        )


@cocotb.test()
async def equality_covers_both_values(dut):
    for a, b in ((0, 0), (0, 1), (1, 0), (1, 1)):
        dut.left.value = a
        dut.right.value = b
        await settle()
        exp = int(a == b)
        assert str(dut.same.value) == str(exp), (
            f"left={a}, right={b}: expected same={exp}; observed {dut.same.value}."
        )


@cocotb.test()
async def repaired_signal_never_resolves_unknown(dut):
    for v in (0, 1):
        dut.source.value = v
        await settle()
        assert str(dut.conflict_free.value) == str(v), (
            f"source={v}: expected conflict_free={v}; observed {dut.conflict_free.value}."
        )
