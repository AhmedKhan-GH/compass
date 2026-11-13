import cocotb
from cocotb.triggers import Timer

async def cycle(dut):
    before=str(dut.visitors.value)
    dut.clk.value=0
    await Timer(1,unit="ns")
    assert str(dut.visitors.value)==before, "count changed away from the rising edge"
    dut.clk.value=1
    await Timer(1,unit="ns")

@cocotb.test()
async def shared_header_preserves_build_choices(dut):
    assert len(dut.visitors)==8

@cocotb.test()
async def reusable_counter_resets_holds_and_wraps(dut):
    dut.reset.value=1;dut.arrival.value=1;await cycle(dut);assert int(dut.visitors.value)==0
    dut.reset.value=0
    for expected in range(1,10): await cycle(dut);assert int(dut.visitors.value)==expected
    dut.arrival.value=0;await cycle(dut);assert int(dut.visitors.value)==9

@cocotb.test()
async def reusable_indicator_checks_each_threshold(dut):
    dut.reset.value=1;dut.arrival.value=0;await cycle(dut);dut.reset.value=0;dut.arrival.value=1
    for expected in range(1,8): await cycle(dut);assert int(dut.busy.value)==int(expected>=6)

@cocotb.test()
async def assembled_kits_keep_their_configuration(dut):
    dut.reset.value=1;dut.arrival.value=1;await cycle(dut);dut.reset.value=0
    for _ in range(260): await cycle(dut)
    assert int(dut.visitors.value)==4
