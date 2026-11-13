import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def carry_a_four_bit_pattern(dut):
    """Carry the complete four-bit pattern 1010 to the output."""
    # This setting also produces 1010 after the later input-packing task.
    dut.ready.value = 1
    dut.fault.value = 0
    dut.mode.value = 2
    await Timer(1, unit="ns")
    actual = str(dut.status.value)
    assert actual == "1010", (
        f"At ready=1, fault=0, mode=10: expected the four-bit status=1010; observed {actual}."
    )


@cocotb.test()
async def pack_status_fields(dut):
    """Pack the four input bits in their specified positions."""
    for ready in (0, 1):
        for fault in (0, 1):
            for mode in range(4):
                dut.ready.value = ready
                dut.fault.value = fault
                dut.mode.value = mode
                await Timer(1, unit="ns")
                expected = f"{ready}{fault}{mode:02b}"
                actual = str(dut.status.value)
                assert actual == expected, (
                    f"ready={ready}, fault={fault}, mode={mode:02b}: "
                    f"expected status={expected}; observed {actual}."
                )


@cocotb.test()
async def extract_fault_bit(dut):
    """Recover the fault bit independently of ready and mode."""
    for ready in (0, 1):
        for fault in (0, 1):
            for mode in range(4):
                dut.ready.value = ready
                dut.fault.value = fault
                dut.mode.value = mode
                await Timer(1, unit="ns")
                actual = str(dut.fault_seen.value)
                assert actual == str(fault), (
                    f"ready={ready}, fault={fault}, mode={mode:02b}: "
                    f"expected fault_seen={fault}; observed {actual}."
                )


@cocotb.test()
async def extract_mode_field(dut):
    """Recover both mode bits in their original order."""
    for ready in (0, 1):
        for fault in (0, 1):
            for mode in range(4):
                dut.ready.value = ready
                dut.fault.value = fault
                dut.mode.value = mode
                await Timer(1, unit="ns")
                expected = f"{mode:02b}"
                actual = str(dut.mode_seen.value)
                assert actual == expected, (
                    f"ready={ready}, fault={fault}, mode={mode:02b}: "
                    f"expected mode_seen={expected}; observed {actual}."
                )


@cocotb.test()
async def recognize_service_mode(dut):
    """Recognize exactly mode 10 regardless of the two flags."""
    for ready in (0, 1):
        for fault in (0, 1):
            for mode in range(4):
                dut.ready.value = ready
                dut.fault.value = fault
                dut.mode.value = mode
                await Timer(1, unit="ns")
                expected = "1" if mode == 2 else "0"
                actual = str(dut.service_mode.value)
                assert actual == expected, (
                    f"ready={ready}, fault={fault}, mode={mode:02b}: "
                    f"expected service_mode={expected}; observed {actual}."
                )
