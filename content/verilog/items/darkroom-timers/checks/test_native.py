from nebula_native import simulate


def check(mode):
    result = simulate(dut="grading_fixture.v", defines=[mode], top="testbench")
    assert not result.timed_out, "Every exposure task must return after its duration."
    assert result.returncode == 0, result.stdout
    assert (
        "CHECK_PASS fixture" in result.stdout and "CHECK_FAIL" not in result.stdout
    ), result.stdout


def test_times_individual_exposures():
    """Each lamp turns on for its own duration and then turns off."""
    check("SINGLE")


def test_preserves_overlapping_exposures():
    """Staggered and simultaneous calls keep their own lamp and duration."""
    check("OVERLAP")
