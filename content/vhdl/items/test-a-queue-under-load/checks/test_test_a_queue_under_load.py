from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut)
    assert not result.timed_out, f"checker timed out against {dut}"
    assert result.returncode == 0, result.stdout
    return result


def test_accepts_correct_dut():
    result = run("dut_correct.vhd")
    assert "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout


def test_rejects_wrap_and_reset_faults():
    for dut in ("dut_wrong_wrap.vhd", "dut_wrong_reset.vhd"):
        result = run(dut)
        assert "CHECK_FAIL" in result.stdout and "CHECK_PASS" not in result.stdout, f"{dut}:\n{result.stdout}"
