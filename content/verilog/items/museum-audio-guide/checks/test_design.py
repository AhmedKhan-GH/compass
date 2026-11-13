import cocotb
from cocotb.triggers import Timer


async def sample(dut, beacon, button=0, present=0):
    dut.beacon.value = beacon
    dut.listen_button.value = button
    dut.signal_present.value = present
    await Timer(1, unit="ns")


def expect(signal, expected, context):
    actual = str(signal.value).lower()
    bits = format(expected, f"0{len(signal)}b")
    assert actual == bits, f"{context}: expected {bits}; observed {actual}."


@cocotb.test()
async def every_exhibit_reaches_the_handset(dut):
    """Every exhibit number survives the receiver connection."""
    for stop in range(16):
        await sample(dut, (stop << 4) | 5)
        expect(dut.recognized_stop, stop, f"Exhibit {stop}")


@cocotb.test()
async def all_volume_bits_reach_the_speaker(dut):
    """The visitor can receive all sixteen volume settings."""
    for volume in range(16):
        await sample(dut, 0xA0 | volume)
        expect(dut.speaker_volume, volume, f"Volume {volume}")


@cocotb.test()
async def listening_requires_a_button_and_a_signal(dut):
    """Playback requires both the visitor's request and a nearby exhibit."""
    for button, present in ((0, 0), (1, 0), (0, 1), (1, 1), (0, 1), (1, 0)):
        for beacon in (0x00, 0xF2, 0x7B):
            await sample(dut, beacon, button, present)
            expect(dut.play_request, button & present,
                   f"button={button}, signal_present={present}")
