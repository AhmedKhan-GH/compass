import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def task_one_behavior(dut):
    for row in [
        (0, 0, 0, 0, 0),
        (0, 0, 1, 0, 0),
        (0, 1, 0, 0, 0),
        (0, 1, 1, 0, 0),
        (1, 0, 0, 1, 1),
        (1, 0, 1, 1, 2),
        (1, 1, 0, 0, 0),
        (1, 1, 1, 0, 0),
    ]:
        values = row[:3]
        expected = row[3:]
        for signal, value in zip(["request", "blocked", "boost"], values):
            dut[signal].value = value
        await Timer(1, unit="ns")
        for index, signal in enumerate(["fan_on", "speed"]):
            if signal not in ["fan_on"]:
                continue
            raw = str(dut[signal].value)
            assert set(raw) <= set("01"), (
                f"inputs={dict(zip(['request', 'blocked', 'boost'], values))}: expected resolved {signal}, observed {raw}"
            )
            actual = int(raw, 2)
            assert actual == expected[index], (
                f"inputs={dict(zip(['request', 'blocked', 'boost'], values))}: expected {signal}={expected[index]}, observed {actual}"
            )


@cocotb.test()
async def task_two_behavior(dut):
    for row in [
        (0, 0, 0, 0, 0),
        (0, 0, 1, 0, 0),
        (0, 1, 0, 0, 0),
        (0, 1, 1, 0, 0),
        (1, 0, 0, 1, 1),
        (1, 0, 1, 1, 2),
        (1, 1, 0, 0, 0),
        (1, 1, 1, 0, 0),
    ]:
        values = row[:3]
        expected = row[3:]
        for signal, value in zip(["request", "blocked", "boost"], values):
            dut[signal].value = value
        await Timer(1, unit="ns")
        for index, signal in enumerate(["fan_on", "speed"]):
            if signal not in ["speed"]:
                continue
            raw = str(dut[signal].value)
            assert set(raw) <= set("01"), (
                f"inputs={dict(zip(['request', 'blocked', 'boost'], values))}: expected resolved {signal}, observed {raw}"
            )
            actual = int(raw, 2)
            assert actual == expected[index], (
                f"inputs={dict(zip(['request', 'blocked', 'boost'], values))}: expected {signal}={expected[index]}, observed {actual}"
            )
