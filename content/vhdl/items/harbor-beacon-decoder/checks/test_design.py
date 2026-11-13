import cocotb
from cocotb.triggers import Timer
from cocotb.types import LogicArray

async def check(dut,value,family):
    dut.message.value=LogicArray(value);await Timer(1,unit="ns");assert str(dut.candidate_family.value)==family

@cocotb.test()
async def candidate_matching_uses_std_match(dut):
    for value,family in (("0000","01"),("0111","10"),("1010","11"),("X000","00")): await check(dut,value,family)

@cocotb.test()
async def unknown_bits_block_publication(dut):
    for value in ("0X00","10Z1"): dut.message.value=LogicArray(value);await Timer(1,unit="ns");assert int(dut.word_known.value)==0 and str(dut.accepted_family.value)=="00"

@cocotb.test()
async def only_complete_messages_publish(dut):
    dut.message.value=LogicArray("0110");await Timer(1,unit="ns");assert int(dut.word_known.value)==1 and str(dut.accepted_family.value)=="10"
