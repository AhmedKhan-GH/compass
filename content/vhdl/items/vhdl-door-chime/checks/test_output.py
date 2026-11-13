import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def test_short_pulse(dut):
    """Rejects a short pulse on the chime but preserves it on the trace."""
    dut.contact.value = 0
    await Timer(6, unit="ns")
    dut.contact.value = 1
    await Timer(2, unit="ns")
    dut.contact.value = 0
    await Timer(2, unit="ns")
    assert int(dut.chime.value) == 0 and int(dut.trace.value) == 0
    await Timer(1, unit="ns")
    await Timer(1, unit="ps")
    assert int(dut.chime.value) == 0 and int(dut.trace.value) == 1
    await Timer(2, unit="ns")
    assert int(dut.chime.value) == 0 and int(dut.trace.value) == 0


@cocotb.test()
async def test_sustained_event(dut):
    """Delays both edges of a sustained contact event."""
    dut.contact.value = 0
    await Timer(6, unit="ns")
    dut.contact.value = 1
    await Timer(4, unit="ns")
    assert int(dut.chime.value) == 0 and int(dut.trace.value) == 0
    await Timer(1, unit="ns")
    await Timer(1, unit="ps")
    assert int(dut.chime.value) == 1 and int(dut.trace.value) == 1
    await Timer(4, unit="ns")
    dut.contact.value = 0
    await Timer(5, unit="ns")
    await Timer(1, unit="ps")
    assert int(dut.chime.value) == 0 and int(dut.trace.value) == 0
