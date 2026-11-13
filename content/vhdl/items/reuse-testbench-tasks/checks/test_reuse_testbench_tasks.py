from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut)
    assert not result.timed_out, f"checker timed out against {dut}"
    assert result.returncode == 0, result.stdout
    return result


def test_accepts_correct_dut():
    """Accept loads, holds, and reset in the correct register."""
    result = run("dut_correct.vhd")
    assert "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout


def test_rejects_wrong_load_and_reset():
    """Reject distinct load-enable and reset faults."""
    for dut in ("dut_wrong_load.vhd", "dut_wrong_reset.vhd"):
        result = run(dut)
        assert "CHECK_FAIL" in result.stdout and "CHECK_PASS" not in result.stdout, result.stdout
