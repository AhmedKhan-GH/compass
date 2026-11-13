import cocotb
from cocotb.types import Logic, LogicArray
from cocotb.triggers import Timer


async def sample(dut, request="0", mode="0", manual="0000", scheduled="0000"):
    dut.request.value = Logic(request)
    dut.manual_mode.value = Logic(mode)
    dut.manual_opening.value = LogicArray(manual)
    dut.scheduled_opening.value = LogicArray(scheduled)
    await Timer(1, unit="ns")


def expect(signal, expected, context):
    actual = str(signal.value).lower()
    assert actual == expected.lower(), (
        f"{context}: expected {expected.lower()}; observed {actual}."
    )


@cocotb.test()
async def only_a_definite_request_is_recorded(dut):
    """The procedural model records a request only for a definite 1."""
    for request in ("0", "1", "x", "1", "z", "0", "1", "0"):
        await sample(dut, request=request)
        expect(dut.motor_request, "1" if request == "1" else "0",
               f"request={request}")


@cocotb.test()
async def uncertain_selection_preserves_agreeing_bits(dut):
    """An uncertain mode preserves agreeing opening bits and exposes disagreement."""
    pairs = [("1010", "1000"), ("0000", "1111"), ("0110", "0110"),
             ("1x0z", "1x0z"), ("1x0z", "100z"), ("zzzz", "zzzz"),
             ("x1z0", "0101")]
    pairs += [(format(a, "04b"), format(b, "04b"))
              for a in range(16) for b in range(16)]
    for manual, scheduled in pairs:
        for mode in ("0", "1", "x", "z"):
            await sample(dut, mode=mode, manual=manual, scheduled=scheduled)
            expected = (manual if mode == "1" else scheduled if mode == "0"
                        else "".join(a if a == b else "x"
                                     for a, b in zip(manual, scheduled)))
            expect(dut.chosen_opening, expected,
                   f"mode={mode}, manual={manual}, scheduled={scheduled}")


@cocotb.test()
async def diagnostics_compare_all_four_states_literally(dut):
    """Log comparison returns a definite answer even when readings contain X/Z."""
    values = ("0000", "0001", "1010", "1111", "1x0z", "100z",
              "1z0x", "xxxx", "zzzz")
    for manual in values:
        for scheduled in values:
            await sample(dut, manual=manual, scheduled=scheduled)
            expect(dut.readings_identical, "1" if manual == scheduled else "0",
                   f"manual={manual}, scheduled={scheduled}")
