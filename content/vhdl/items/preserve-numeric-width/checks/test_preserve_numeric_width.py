import cocotb
from cocotb.triggers import Timer


def expect(signal, value, context):
    assert str(signal.value) == f"{value:0{len(signal)}b}", (
        f"{context}: expected {signal._name}={value}; observed {signal.value}"
    )


async def cases(dut):
    # Preserve the original 1,280 input pairs without repeating a giant table.
    for a in range(256):
        for b in (0, 1, 127, 128, 255):
            dut.a.value = a
            dut.b.value = b
            await Timer(1, unit="ns")
            yield a + b, f"a={a}, b={b}"


@cocotb.test()
async def task_one_behavior(dut):
    """The full result preserves all nine bits of the mathematical sum."""
    async for total, context in cases(dut):
        expect(dut.full_sum, total, context)


@cocotb.test()
async def task_two_behavior(dut):
    """The wrapped byte and carry describe the same complete sum."""
    async for total, context in cases(dut):
        expect(dut.wrapped, total % 256, context)
        expect(dut.carry, int(total >= 256), context)
