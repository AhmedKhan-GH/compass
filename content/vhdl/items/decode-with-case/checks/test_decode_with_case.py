import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def task_one_behavior(dut):
    for row in [
        (0, 1, 0),
        (1, 2, 1),
        (2, 4, 1),
        (3, 8, 1),
        (4, 0, 0),
        (5, 0, 0),
        (6, 0, 0),
        (7, 0, 0),
    ]:
        values = row[:1]
        expected = row[1:]
        for signal, value in zip(["mode"], values):
            dut[signal].value = value
        await Timer(1, unit="ns")
        for index, signal in enumerate(["lamps", "enabled"]):
            if signal not in ["lamps"]:
                continue
            raw = str(dut[signal].value)
            assert set(raw) <= set("01"), (
                f"inputs={dict(zip(['mode'], values))}: expected resolved {signal}, observed {raw}"
            )
            actual = int(raw, 2)
            assert actual == expected[index], (
                f"inputs={dict(zip(['mode'], values))}: expected {signal}={expected[index]}, observed {actual}"
            )


@cocotb.test()
async def task_two_behavior(dut):
    for row in [
        (0, 1, 0),
        (1, 2, 1),
        (2, 4, 1),
        (3, 8, 1),
        (4, 0, 0),
        (5, 0, 0),
        (6, 0, 0),
        (7, 0, 0),
    ]:
        values = row[:1]
        expected = row[1:]
        for signal, value in zip(["mode"], values):
            dut[signal].value = value
        await Timer(1, unit="ns")
        for index, signal in enumerate(["lamps", "enabled"]):
            if signal not in ["enabled"]:
                continue
            raw = str(dut[signal].value)
            assert set(raw) <= set("01"), (
                f"inputs={dict(zip(['mode'], values))}: expected resolved {signal}, observed {raw}"
            )
            actual = int(raw, 2)
            assert actual == expected[index], (
                f"inputs={dict(zip(['mode'], values))}: expected {signal}={expected[index]}, observed {actual}"
            )
