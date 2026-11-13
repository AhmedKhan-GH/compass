import cocotb
from cocotb.clock import Clock
from cocotb.triggers import RisingEdge, Timer


async def reset_all(dut):
    cocotb.start_soon(Clock(dut.clk, 10, unit="ns").start())
    for name in ("v1", "v3", "v5", "r1", "r3", "r5"):
        getattr(dut, name).value = 0
    dut.reset.value = 1
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")
    dut.reset.value = 0


async def cycle(dut, n, valid=0, data=0, ready=0):
    getattr(dut, "v" + n).value = valid
    getattr(dut, "d" + n).value = data
    getattr(dut, "r" + n).value = ready
    accepted_in = bool(valid and int(getattr(dut, "ir" + n).value))
    accepted_out = bool(ready and int(getattr(dut, "ov" + n).value))
    old_out = (
        int(getattr(dut, "q" + n).value) if int(getattr(dut, "ov" + n).value) else None
    )
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")
    return accepted_in, accepted_out, old_out


async def scenario(dut, n, depth):
    model = []
    for index, value in enumerate(range(10, 10 + depth)):
        pushed, popped, _ = await cycle(dut, n, 1, value, 0)
        assert pushed and not popped, (
            f"depth {depth}, fill cycle {index}: expected push=1 pop=0; observed push={pushed} pop={popped}"
        )
        model.append(value)
    got_ready = int(getattr(dut, "ir" + n).value)
    assert got_ready == 0, (
        f"depth {depth} full: expected in_ready=0; observed {got_ready}"
    )
    pushed, _, _ = await cycle(dut, n, 1, 99, 0)
    assert not pushed, (
        f"depth {depth} rejected write: expected accepted=0; observed {pushed}"
    )

    _, popped, word = await cycle(dut, n, 0, 0, 1)
    expected = model.pop(0)
    assert popped and word == expected, (
        f"depth {depth}, first pop: expected word={expected}; observed word={word}, accepted={popped}"
    )
    for index, value in enumerate(range(40, 40 + depth * 2)):
        pushed, popped, word = await cycle(dut, n, 1, value, 1)
        if popped:
            expected = model.pop(0)
            assert word == expected, (
                f"depth {depth}, simultaneous cycle {index}: expected word={expected}; observed {word}"
            )
        if pushed:
            model.append(value)

    if model:
        held = int(getattr(dut, "q" + n).value)
        await cycle(dut, n, 0, 0, 0)
        await cycle(dut, n, 0, 0, 0)
        observed = int(getattr(dut, "q" + n).value)
        assert observed == held, (
            f"depth {depth} stall: expected out_data={held}; observed {observed}"
        )
    index = 0
    while model:
        _, popped, word = await cycle(dut, n, 0, 0, 1)
        expected = model.pop(0)
        assert popped and word == expected, (
            f"depth {depth}, drain cycle {index}: expected word={expected}; observed word={word}, accepted={popped}"
        )
        index += 1
    got_valid = int(getattr(dut, "ov" + n).value)
    assert got_valid == 0, (
        f"depth {depth} empty: expected out_valid=0; observed {got_valid}"
    )
    _, popped, _ = await cycle(dut, n, 0, 0, 1)
    assert not popped, (
        f"depth {depth} rejected read: expected accepted=0; observed {popped}"
    )


@cocotb.test()
async def depth_one_full_empty_and_replace(dut):
    await reset_all(dut)
    await scenario(dut, "1", 1)


@cocotb.test()
async def depth_three_wrap_and_order(dut):
    await reset_all(dut)
    await scenario(dut, "3", 3)


@cocotb.test()
async def depth_five_bursts_stalls_and_order(dut):
    await reset_all(dut)
    await scenario(dut, "5", 5)


@cocotb.test()
async def reset_discards_words_midstream(dut):
    await reset_all(dut)
    for value in (1, 2, 3):
        await cycle(dut, "5", 1, value, 0)
    dut.reset.value = 1
    await RisingEdge(dut.clk)
    await Timer(1, unit="ns")
    dut.reset.value = 0
    got_valid = int(dut.ov5.value)
    got_ready = int(dut.ir5.value)
    assert got_valid == 0 and got_ready == 1, (
        f"reset midstream: expected out_valid=0 and in_ready=1; observed out_valid={got_valid}, in_ready={got_ready}"
    )
