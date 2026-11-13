import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


def expect(signal, expected, context):
    observed = signal.value
    assert observed.is_resolvable, (
        f"{context}: expected {expected:#x}; observed {observed}"
    )
    assert int(observed) == expected, (
        f"{context}: expected {expected:#x}; observed {int(observed):#x}"
    )


async def edge(dut):
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")


async def start(dut):
    dut.reset.value = 1
    dut.write_en.value = 0
    dut.write_addr.value = 0
    dut.write_data.value = 0
    dut.read_addr.value = 0
    cocotb.start_soon(Clock(dut.clk, 10, unit="ns").start())
    await edge(dut)
    dut.reset.value = 0


@cocotb.test()
async def basic_behavior(dut):
    """Store independent words and update reads only after rising edges."""
    await start(dut)
    words = [0x11, 0x22, 0x44, 0x88, 0xA5]
    for address, word in enumerate(words):
        dut.write_en.value = 1
        dut.write_addr.value = address
        dut.write_data.value = word
        dut.read_addr.value = (address + 1) % 5
        await edge(dut)
    dut.write_en.value = 0
    for address, word in enumerate(words):
        dut.read_addr.value = address
        await edge(dut)
        expect(dut.read_data, word, f"read address {address}")
    dut.read_addr.value = 0
    await Timer(1, unit="ns")
    expect(dut.read_data, words[4], "read output must hold between edges")
    await edge(dut)
    expect(dut.read_data, words[0], "new read appears after the next edge")
    dut.write_addr.value = 0
    dut.write_data.value = 0xEE
    await edge(dut)
    expect(dut.read_data, words[0], "write_en=0 preserves memory")


@cocotb.test()
async def boundary_behavior(dut):
    """Use write-first collisions, reject unused addresses, and clear all words on reset."""
    await start(dut)
    for address, word in [(0, 0x17), (4, 0x99)]:
        dut.write_en.value = 1
        dut.write_addr.value = address
        dut.write_data.value = word
        dut.read_addr.value = address
        await edge(dut)
        expect(dut.read_data, word, f"write-first collision at address {address}")
    dut.write_addr.value = 7
    dut.write_data.value = 0xFF
    dut.read_addr.value = 0
    await edge(dut)
    expect(dut.read_data, 0x17, "invalid write must preserve legal words")
    dut.read_addr.value = 7
    await edge(dut)
    expect(dut.read_data, 0, "invalid read must return zero")
    dut.reset.value = 1
    dut.write_addr.value = 0
    dut.read_addr.value = 0
    await edge(dut)
    expect(dut.read_data, 0, "reset takes priority over a write")
    dut.reset.value = 0
    dut.write_en.value = 0
    for address in range(5):
        dut.read_addr.value = address
        await edge(dut)
        expect(dut.read_data, 0, f"reset cleared stored address {address}")
