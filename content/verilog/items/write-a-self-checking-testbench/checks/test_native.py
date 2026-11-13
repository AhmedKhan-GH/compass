from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut, top="testbench")
    assert not result.timed_out, f"checker timed out against {dut}"
    return result


def test_accepts_correct_selector():
    """Accepts correct selector."""
    good = run("dut_correct.v")
    assert (
        good.returncode == 0
        and "CHECK_PASS" in good.stdout
        and "CHECK_FAIL" not in good.stdout
    ), f"correct DUT must pass; output:\n{good.stdout}"


def test_rejects_miswired_selectors():
    """Rejects miswired selectors."""
    good = run("dut_correct.v")
    assert (
        good.returncode == 0
        and "CHECK_PASS" in good.stdout
        and "CHECK_FAIL" not in good.stdout
    ), f"correct DUT must pass; output:\n{good.stdout}"
    bad = run("dut_reversed.v")
    assert "CHECK_FAIL" in bad.stdout and "CHECK_PASS" not in bad.stdout, (
        f"dut_reversed.v must be rejected; output:\n{bad.stdout}"
    )
    bad = run("dut_stuck.v")
    assert "CHECK_FAIL" in bad.stdout and "CHECK_PASS" not in bad.stdout, (
        f"dut_stuck.v must be rejected; output:\n{bad.stdout}"
    )
