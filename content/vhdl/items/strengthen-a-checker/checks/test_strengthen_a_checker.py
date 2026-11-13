from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut)
    assert not result.timed_out, f"checker timed out against {dut}"
    assert result.returncode == 0, result.stdout
    return result


def test_accepts_correct_dut():
    """The checker accepts the supplied correct implementation."""
    result = run("dut_correct.vhd")
    assert "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, (
        result.stdout
    )


def test_rejects_faulty_dut():
    """The checker rejects incorrect data, reset, and hold behavior."""
    for dut in ("dut_faulty.vhd", "dut_bad_reset.vhd", "dut_bad_hold.vhd"):
        result = run(dut)
        assert "CHECK_FAIL" in result.stdout and "CHECK_PASS" not in result.stdout, (
            f"checker accepted {dut}:\n{result.stdout}"
        )
