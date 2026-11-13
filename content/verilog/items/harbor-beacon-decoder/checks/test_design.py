import itertools

import cocotb
from cocotb.types import LogicArray
from cocotb.triggers import Timer


WORDS = ["".join(bits) for bits in itertools.product("01xz", repeat=4)]


def candidate(word):
    for pattern, family in (("00??", 1), ("01??", 2), ("1???", 3)):
        if all(required == "?" or observed == "z" or observed == required
               for observed, required in zip(word, pattern)):
            return family
    return 0


async def sample(dut, word):
    dut.message.value = LogicArray(word)
    await Timer(1, unit="ns")


def expect(signal, expected, word):
    actual = str(signal.value).lower()
    bits = format(expected, f"0{len(signal)}b")
    assert actual == bits, f"message={word}: expected {bits}; observed {actual}."


@cocotb.test()
async def candidate_matching_uses_casez_not_casex(dut):
    """Wildcard classification preserves significant X and uses ordered Z matching."""
    for word in WORDS:
        await sample(dut, word)
        expect(dut.candidate_family, candidate(word), word)


@cocotb.test()
async def complete_messages_have_no_unknown_or_floating_bits(dut):
    """Every bit, including ignored fields, must be known for a complete message."""
    for word in WORDS:
        await sample(dut, word)
        expect(dut.word_known, int(all(bit in "01" for bit in word)), word)


@cocotb.test()
async def only_complete_messages_publish_an_announcement(dut):
    """Incomplete words never publish even a plausible candidate announcement."""
    for word in ["z001", "0001", "1xx1", "1101"] + WORDS:
        await sample(dut, word)
        expected = candidate(word) if all(bit in "01" for bit in word) else 0
        expect(dut.accepted_family, expected, word)
