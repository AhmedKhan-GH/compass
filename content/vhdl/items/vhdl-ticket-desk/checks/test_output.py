import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def test_concurrent_issues(dut):
    """Serializes ticket issues from concurrent clerks."""
    await Timer(4, unit="ns")
    assert int(dut.done.value) == 1
    assert int(dut.issued_out.value) == 6


@cocotb.test()
async def test_served_and_waiting(dut):
    """Updates served and waiting counts through protected methods."""
    await Timer(4, unit="ns")
    assert [int(dut.served_out.value), int(dut.waiting_out.value)] == [3, 3]
