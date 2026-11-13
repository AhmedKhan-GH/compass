from nebula_native import simulate


def check(mode):
    result = simulate(dut="grading_fixture.v", defines=[mode], top="testbench")
    assert not result.timed_out, (
        "The startup helper did not honor its wait or deadline."
    )
    assert result.returncode == 0, result.stdout
    assert (
        "CHECK_PASS fixture" in result.stdout and "CHECK_FAIL" not in result.stdout
    ), result.stdout


def test_handles_readiness_now_and_later():
    """Return for present or future readiness, while ignoring unknown states."""
    check("CONDITION_WAIT")


def test_observes_the_complete_deadline_schedule():
    """Poll at the stated microsecond intervals, including zero and final samples."""
    check("BOUNDED_POLL")
