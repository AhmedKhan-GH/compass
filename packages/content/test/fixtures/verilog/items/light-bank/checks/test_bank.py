import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def both_lights_on(dut):
    """Both lights are on after settling."""
    await Timer(1, unit="ns")
    actual = str(dut.lights.value)
    assert actual == "11", f"Expected lights = 11 after settling; observed {actual}."
