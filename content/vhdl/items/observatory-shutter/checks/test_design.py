import cocotb
from cocotb.triggers import Timer
from cocotb.types import Logic, LogicArray

@cocotb.test()
async def definite_request_only(dut):
    for request,expected in ((Logic("0"),0),(Logic("1"),1),(Logic("X"),0),(Logic("Z"),0)): dut.request.value=request;await Timer(1,unit="ns");assert int(dut.motor_request.value)==expected

@cocotb.test()
async def uncertain_selection_preserves_agreeing_bits(dut):
    dut.manual_opening.value=LogicArray("1010");dut.scheduled_opening.value=LogicArray("1000");dut.manual_mode.value=Logic("X");await Timer(1,unit="ns");assert str(dut.chosen_opening.value)=="10X0"

@cocotb.test()
async def literal_std_logic_vector_identity(dut):
    dut.manual_opening.value=LogicArray("1X0Z");dut.scheduled_opening.value=LogicArray("1X0Z");await Timer(1,unit="ns");assert int(dut.readings_identical.value)==1
    dut.scheduled_opening.value=LogicArray("1X00");await Timer(1,unit="ns");assert int(dut.readings_identical.value)==0
