from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut)
    assert not result.timed_out, f"checker timed out against {dut}"
    return result


def test_checks_pipeline_latency():
    """Checks pipeline latency."""
    good = run("dut_correct.vhd")
    assert (
        good.returncode == 0
        and "CHECK_PASS" in good.stdout
        and "CHECK_FAIL" not in good.stdout
    ), f"correct DUT must pass; output:\n{good.stdout}"
    bad = run("dut_one_stage.vhd")
    assert "CHECK_FAIL" in bad.stdout and "CHECK_PASS" not in bad.stdout, (
        f"dut_one_stage.v must be rejected; output:\n{bad.stdout}"
    )
    bad = run("dut_three_stage.vhd")
    assert "CHECK_FAIL" in bad.stdout and "CHECK_PASS" not in bad.stdout, (
        f"dut_three_stage.v must be rejected; output:\n{bad.stdout}"
    )
