import cocotb
from cocotb.triggers import Timer


@cocotb.test()
async def complete_behavior(dut):
    for row in [
        (0, 126, 1),
        (1, 48, 1),
        (2, 109, 1),
        (3, 121, 1),
        (4, 51, 1),
        (5, 91, 1),
        (6, 95, 1),
        (7, 112, 1),
        (8, 127, 1),
        (9, 123, 1),
        (10, 0, 0),
        (11, 0, 0),
        (12, 0, 0),
        (13, 0, 0),
        (14, 0, 0),
        (15, 0, 0),
    ]:
        values = row[:1]
        expected = row[1:]
        for signal, value in zip(["digit"], values):
            dut[signal].value = value
        await Timer(1, unit="ns")
        for index, signal in enumerate(["segments", "valid"]):
            if signal not in ["segments", "valid"]:
                continue
            raw = str(dut[signal].value)
            assert set(raw) <= set("01"), (
                f"inputs={dict(zip(['digit'], values))}: expected resolved {signal}, observed {raw}"
            )
            actual = int(raw, 2)
            assert actual == expected[index], (
                f"inputs={dict(zip(['digit'], values))}: expected {signal}={expected[index]}, observed {actual}"
            )
