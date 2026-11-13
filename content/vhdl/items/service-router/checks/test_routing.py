import cocotb
from cocotb.triggers import Timer


async def check_routing(dut, data, destination, enabled):
    dut.data.value = data
    dut.destination.value = destination
    dut.enabled.value = enabled
    await Timer(1, unit="ns")
    for lane in range(3):
        expected = data if enabled and destination == lane else 0
        actual = str(dut[f"lane_{lane}"].value)
        assert actual == f"{expected:04b}", (
            f"data = {data:04b}, destination = {destination:02b}, enabled = {enabled}: "
            f"expected lane_{lane} = {expected:04b}; observed {actual}."
        )


@cocotb.test()
async def selected_lane_receives_every_word(dut):
    """Only the selected lane receives data, including the unused destination."""
    for destination in range(4):
        for data in range(16):
            await check_routing(dut, data, destination, 1)


@cocotb.test()
async def disabling_clears_every_lane(dut):
    """Disabling clears every lane for every destination and data word."""
    for destination in range(4):
        for data in range(16):
            await check_routing(dut, data, destination, 1)
            await check_routing(dut, data, destination, 0)


@cocotb.test()
async def rerouting_leaves_no_old_word(dut):
    """Data, destination, and enable changes update all outputs without a clock."""
    for data, destination, enabled in (
        (15, 0, 1),
        (5, 0, 1),
        (5, 1, 1),
        (5, 2, 1),
        (5, 3, 1),
        (10, 1, 1),
        (10, 1, 0),
        (3, 2, 0),
        (3, 2, 1),
        (0, 2, 1),
        (15, 0, 1),
        (0, 3, 0),
    ):
        await check_routing(dut, data, destination, enabled)
