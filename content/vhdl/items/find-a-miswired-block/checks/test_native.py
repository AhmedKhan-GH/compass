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


def test_checks_harness():
    """Checks harness."""
    good = run("dut_correct.vhd")
    assert good.returncode == 0, good.stdout
    assert_verdict(good, "pass", "dut_correct.vhd")
    bad = run("dut_swapped.vhd")
    assert_verdict(bad, "fail", "dut_swapped.vhd")
    bad = run("dut_shared.vhd")
    assert_verdict(bad, "fail", "dut_shared.vhd")
