The pottery workshop has reported a fault in a supplied fan controller: after a run request ends, the fan or the blocked-request indicator sometimes stays on. That leaves the operator seeing an old command instead of what the controls currently ask for. You will reproduce the complaint with the faulty starter, then repair the logic so both outputs respond correctly when a request ends.

## Required behavior

Inputs `request` and `blocked`, and outputs `fan_on` and `fault`, are one bit. With `request=0`, both outputs must be `0`. With `request=1` and `blocked=0`, set `fan_on=1` and `fault=0`. With both inputs high, set `fan_on=0` and `fault=1`. Outputs depend only on the current inputs; there is no clock or stored history.

## Before you code

Which input change would reveal an output that stays on by mistake? Find a way to reproduce it before changing the code.

## Check your reasoning

Run the faulty starter and inspect its circuit. After repair, end a request after each active case and look for any remaining latch.

Keep the supplied module interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
