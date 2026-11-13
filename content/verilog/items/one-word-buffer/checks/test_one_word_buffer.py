import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


def expect(signal, value, context):
    assert str(signal.value) == f"{value:0{len(signal)}b}", (
        f"{context}: expected {signal._name}={value}; observed {signal.value}"
    )


async def edge(dut):
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")


async def start(dut):
    dut.reset.value = 1
    dut.flush.value = 0
    dut.in_valid.value = 0
    dut.in_data.value = 0
    dut.out_ready.value = 0
    cocotb.start_soon(Clock(dut.clk, 10, unit="ns").start())
    await edge(dut)
    dut.reset.value = 0
    await Timer(1, unit="ns")


@cocotb.test()
async def capture_hold_remove_and_replace(dut):
    """Hold during stalls, replace atomically, and become empty after removal."""
    await start(dut)
    expect(dut.in_ready, 1, "empty can accept")
    dut.in_valid.value = 1
    dut.in_data.value = 9
    await edge(dut)
    expect(dut.out_valid, 1, "accepted word is valid")
    expect(dut.out_data, 9, "accepted word")
    dut.in_data.value = 10
    expect(dut.in_ready, 0, "full receiver stall")
    for _ in range(3):
        await edge(dut)
        expect(dut.out_data, 9, "stall preserves old word")
        expect(dut.out_valid, 1, "stall preserves validity")
    dut.out_ready.value = 1
    await Timer(1, unit="ns")
    expect(dut.in_ready, 1, "old word can leave while replacement enters")
    expect(dut.out_data, 9, "receiver sees old word before replacement edge")
    await edge(dut)
    expect(dut.out_data, 10, "replacement visible after edge")
    expect(dut.out_valid, 1, "replacement stays valid")
    dut.in_valid.value = 0
    await edge(dut)
    expect(dut.out_valid, 0, "removal without replacement empties")


@cocotb.test()
async def flush_blocks_both_transfers_and_discards_pending_data(dut):
    """Flush beats stalled data and simultaneous transfer requests."""
    await start(dut)
    for receiver_ready in (0, 1):
        dut.out_ready.value = 0
        dut.in_valid.value = 1
        dut.in_data.value = 9
        await edge(dut)
        dut.in_data.value = 10
        dut.out_ready.value = receiver_ready
        dut.flush.value = 1
        await Timer(1, unit="ns")
        expect(dut.in_ready, 0, "no input acceptance while flush is high")
        expect(dut.out_valid, 0, "no output transfer while flush is high")
        await edge(dut)
        dut.flush.value = 0
        dut.in_valid.value = 0
        await Timer(1, unit="ns")
        expect(dut.out_valid, 0, "pending and offered words were discarded")
        expect(dut.in_ready, 1, "empty after flush")
        dut.out_ready.value = 0
        dut.in_valid.value = 1
        dut.in_data.value = 11
        await edge(dut)
        expect(dut.out_data, 11, "new traffic works after flush")
        dut.reset.value = 1
        await edge(dut)
        dut.reset.value = 0
        dut.in_valid.value = 0
        await Timer(1, unit="ns")
        expect(dut.out_valid, 0, "reset discarded unread data")
