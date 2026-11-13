from nebula_native import simulate

def test_observes_settled_frames():
    result=simulate(dut="grading_fixture.vhd")
    assert result.returncode==0 and "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout

def test_presents_bibs_between_shutter_edges():
    result=simulate(dut="grading_fixture.vhd")
    assert result.returncode==0 and "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout
