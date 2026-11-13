import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def complete_behavior(dut):
    for row in [(0, 0, 0, 0), (0, 1, 0, 0), (1, 0, 1, 0), (1, 1, 0, 1)]:
        values = row[:2]
        expected = row[2:]
        for signal, value in zip(["request", "blocked"], values):
            dut[signal].value = value
        await Timer(1, unit="ns")
        for index, signal in enumerate(["fan_on", "fault"]):
            if signal not in ["fan_on", "fault"]:
                continue
            raw = str(dut[signal].value)
            assert set(raw) <= set("01"), (
                f"inputs={dict(zip(['request', 'blocked'], values))}: expected resolved {signal}, observed {raw}"
            )
            actual = int(raw, 2)
            assert actual == expected[index], (
                f"inputs={dict(zip(['request', 'blocked'], values))}: expected {signal}={expected[index]}, observed {actual}"
            )
