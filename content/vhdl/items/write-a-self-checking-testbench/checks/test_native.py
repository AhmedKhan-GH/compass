from nebula_native import simulate


def run(dut):
    result = simulate(dut=dut, top="testbench")
    assert not result.timed_out, f"checker timed out against {dut}"
    return result


def assert_verdict(result, expected, dut):
    pass_count = result.stdout.count("CHECK_PASS")
    fail_count = result.stdout.count("CHECK_FAIL")
    assert pass_count + fail_count == 1, (
        f"{dut} must produce exactly one verdict marker; output:\n{result.stdout}"
    )
    assert (pass_count == 1) == (expected == "pass"), (
        f"{dut} produced the wrong verdict; output:\n{result.stdout}"
    )


def test_accepts_correct_selector():
    """Accepts correct selector."""
    good = run("dut_correct.vhd")
    assert good.returncode == 0, good.stdout
    assert_verdict(good, "pass", "dut_correct.vhd")


def test_rejects_miswired_selectors():
    """Rejects miswired selectors."""
    good = run("dut_correct.vhd")
    assert good.returncode == 0, good.stdout
    assert_verdict(good, "pass", "dut_correct.vhd")
    bad = run("dut_reversed.vhd")
    assert_verdict(bad, "fail", "dut_reversed.vhd")
    bad = run("dut_stuck.vhd")
    assert_verdict(bad, "fail", "dut_stuck.vhd")
