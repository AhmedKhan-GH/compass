from nebula_native import simulate

def test_times_individual_exposures():
    result=simulate(dut="grading_fixture.vhd")
    assert result.returncode==0 and "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout

def test_preserves_overlapping_exposures():
    result=simulate(dut="grading_fixture.vhd")
    assert result.returncode==0 and "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout
