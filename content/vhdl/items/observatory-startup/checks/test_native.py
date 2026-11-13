from nebula_native import simulate

def test_handles_readiness_now_and_later():
    result=simulate(dut="grading_fixture.vhd")
    assert result.returncode==0 and "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout

def test_observes_the_complete_deadline_schedule():
    result=simulate(dut="grading_fixture.vhd")
    assert result.returncode==0 and "CHECK_PASS" in result.stdout and "CHECK_FAIL" not in result.stdout, result.stdout
