from nebula_native import simulate


def check(mode):
    result = simulate(dut="grading_fixture.v", defines=[mode], top="testbench")
    assert not result.timed_out, "A task never returned; inspect its event controls."
    assert result.returncode == 0, result.stdout
    assert (
        "CHECK_PASS fixture" in result.stdout and "CHECK_FAIL" not in result.stdout
    ), result.stdout


def test_observes_settled_frames():
    """Check matching, mismatched and unknown bibs after the camera update."""
    check("OBSERVATION")


def test_presents_bibs_between_shutter_edges():
    """Present each bib on a falling edge so the next rising edge captures it."""
    check("DRIVING")
