from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut, defines=[], top="testbench")
    assert not result.timed_out, f"checker timed out against {dut}"
    assert result.returncode == 0, result.stdout
    return result


def test_accepts_correct_dut():
    """The checker accepts the supplied correct implementation."""
    result = run("dut_correct.v")
    assert "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, (
        result.stdout
    )


def test_rejects_faulty_dut():
    """The checker rejects the supplied realistic faulty implementation."""
    result = run("dut_faulty.v")
    assert "CHECK_FAIL" in result.stdout and "CHECK_PASS" not in result.stdout, (
        result.stdout
    )
