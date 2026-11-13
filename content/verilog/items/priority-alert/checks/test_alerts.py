import cocotb
from cocotb.triggers import Timer


async def check_alert(dut, critical, warning, advisory, code, valid):
    dut.critical.value = critical
    dut.warning.value = warning
    dut.advisory.value = advisory
    await Timer(1, unit="ns")
    actual_code = str(dut.code.value)
    actual_valid = str(dut.valid.value)
    context = f"critical = {critical}, warning = {warning}, advisory = {advisory}"
    assert actual_code == f"{code:02b}", (
        f"{context}: expected code = {code:02b}; observed {actual_code}."
    )
    assert actual_valid == str(valid), (
        f"{context}: expected valid = {valid}; observed {actual_valid}."
    )


@cocotb.test()
async def no_alert_has_zero_code_and_no_validity(dut):
    """No active alert produces code 00 and valid 0."""
    await check_alert(dut, 0, 0, 0, 0, 0)


@cocotb.test()
async def individual_alerts_have_distinct_valid_codes(dut):
    """Each individual alert produces its own code with valid 1."""
    await check_alert(dut, 0, 0, 1, 1, 1)
    await check_alert(dut, 0, 1, 0, 2, 1)
    await check_alert(dut, 1, 0, 0, 3, 1)


@cocotb.test()
async def simultaneous_alerts_respect_priority(dut):
    """Critical wins over warning, and warning wins over advisory."""
    await check_alert(dut, 0, 1, 1, 2, 1)
    await check_alert(dut, 1, 0, 1, 3, 1)
    await check_alert(dut, 1, 1, 0, 3, 1)
    await check_alert(dut, 1, 1, 1, 3, 1)


@cocotb.test()
async def changing_alerts_does_not_retain_an_old_code(dut):
    """Raising and clearing alerts changes the outputs without a clock."""
    for critical, warning, advisory, code, valid in (
        (1, 1, 1, 3, 1),
        (0, 1, 1, 2, 1),
        (0, 0, 1, 1, 1),
        (0, 0, 0, 0, 0),
        (1, 0, 0, 3, 1),
        (0, 0, 0, 0, 0),
        (0, 1, 0, 2, 1),
        (0, 0, 0, 0, 0),
    ):
        await check_alert(dut, critical, warning, advisory, code, valid)
