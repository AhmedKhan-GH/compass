import cocotb
from cocotb.triggers import Timer


def signed_byte(bits):
    return bits if bits < 128 else bits - 256


def expect(signal, bits, context):
    assert str(signal.value) == f"{bits:0{len(signal)}b}", (
        f"{context}: expected {signal._name}={bits:0{len(signal)}b}; observed {signal.value}"
    )


async def cases(dut):
    # Preserve all original input pairs; model temperatures as Python integers.
    for temperature_bits in range(256):
        for limit_bits in (0, 1, 127, 128, 255):
            dut.temperature.value = temperature_bits
            dut.limit.value = limit_bits
            await Timer(1, unit="ns")
            temperature = signed_byte(temperature_bits)
            limit = signed_byte(limit_bits)
            yield temperature, limit, f"temperature={temperature}, limit={limit}"


@cocotb.test()
async def task_one_behavior(dut):
    """Signed temperatures compare correctly across zero and at equality."""
    async for temperature, limit, context in cases(dut):
        expect(dut.below_limit, int(temperature < limit), context)


@cocotb.test()
async def task_two_behavior(dut):
    """Widening preserves numeric value and the negative indicator is exact."""
    async for temperature, limit, context in cases(dut):
        expect(dut.extended, temperature % 4096, context)
        expect(dut.negative, int(temperature < 0), context)
