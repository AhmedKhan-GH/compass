import cocotb
from cocotb.triggers import Timer


async def check_capture(dut, request, enabled, inhibit, expected):
    dut.request.value = request
    dut.enabled.value = enabled
    dut.inhibit.value = inhibit
    await Timer(1, unit="ns")
    actual = str(dut.capture.value)
    assert actual == str(expected), (
        f"With request = {request}, enabled = {enabled}, inhibit = {inhibit}, "
        f"expected capture = {expected}; observed {actual}."
    )


@cocotb.test()
async def no_request_means_no_capture(dut):
    """Enable and inhibit cannot cause a capture without a request."""
    for enabled, inhibit in ((0, 0), (0, 1), (1, 0), (1, 1)):
        await check_capture(dut, 0, enabled, inhibit, 0)


@cocotb.test()
async def disabled_controller_rejects_requests(dut):
    """A request cannot capture while the controller is disabled."""
    await check_capture(dut, 1, 0, 0, 0)
    await check_capture(dut, 1, 0, 1, 0)


@cocotb.test()
async def enabled_request_still_obeys_inhibit(dut):
    """An enabled request captures only while inhibition is absent."""
    await check_capture(dut, 1, 1, 0, 1)
    await check_capture(dut, 1, 1, 1, 0)
    await check_capture(dut, 1, 1, 0, 1)


@cocotb.test()
async def capture_tracks_the_current_conditions(dut):
    """Changing any requirement updates the decision without waiting for a clock."""
    for row in (
        (0, 0, 0, 0),
        (0, 1, 0, 0),
        (1, 1, 0, 1),
        (1, 0, 0, 0),
        (1, 1, 0, 1),
        (1, 1, 1, 0),
        (1, 1, 0, 1),
        (0, 1, 0, 0),
    ):
        await check_capture(dut, *row)
