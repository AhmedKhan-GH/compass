import cocotb
from cocotb.triggers import Timer


def set_inputs(dut, a, b, select_b, channel, override_active, override_data):
    dut.channel_a.value = a
    dut.channel_b.value = b
    dut.select_b.value = select_b
    dut.channel.value = channel
    dut.override_active.value = override_active
    dut.override_data.value = override_data


def expect_word(signal, expected, context):
    actual = str(signal.value)
    assert actual == f"{expected:04b}", (
        f"{context}: expected {signal._name} = {expected:04b}; observed {actual}."
    )


@cocotb.test()
async def two_way_selection_follows_both_inputs(dut):
    """Two-way selection follows both inputs."""
    for a in range(16):
        for b in range(16):
            for select_b in (0, 1):
                # Other controls vary too, but must not control selected.
                set_inputs(dut, a, b, select_b, (a + b) % 4, a % 2, b ^ 15)
                await Timer(1, unit="ns")
                expected = b if select_b else a
                expect_word(
                    dut.selected,
                    expected,
                    f"channel_a = {a:04b}, channel_b = {b:04b}, select_b = {select_b}",
                )


@cocotb.test()
async def code_selection_includes_both_unused_codes(dut):
    """Code selection includes both unused codes."""
    for a in range(16):
        for b in range(16):
            for channel in range(4):
                set_inputs(dut, a, b, a % 2, channel, b % 2, a ^ 15)
                await Timer(1, unit="ns")
                expected = a if channel == 0 else b if channel == 1 else 0
                expect_word(
                    dut.decoded,
                    expected,
                    f"channel_a = {a:04b}, channel_b = {b:04b}, channel = {channel:02b}",
                )


@cocotb.test()
async def override_wins_for_every_channel_code(dut):
    """Override wins for every channel code."""
    for a in range(16):
        for b in range(16):
            for override_data in range(16):
                for channel in range(4):
                    for override_active in (0, 1):
                        set_inputs(
                            dut,
                            a,
                            b,
                            (a ^ b) % 2,
                            channel,
                            override_active,
                            override_data,
                        )
                        await Timer(1, unit="ns")
                        normal = a if channel == 0 else b if channel == 1 else 0
                        expected = override_data if override_active else normal
                        expect_word(
                            dut.priority_selected,
                            expected,
                            f"channel_a = {a:04b}, channel_b = {b:04b}, channel = {channel:02b}, "
                            f"override_active = {override_active}, override_data = {override_data:04b}",
                        )
