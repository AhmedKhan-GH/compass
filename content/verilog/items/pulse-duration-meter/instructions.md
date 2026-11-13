A visitor interrupts a turnstile's light beam while passing through, giving the operator a way to measure how long each crossing occupies the entrance. Using a beam signal already aligned to the clock, you will count the active samples and keep the last completed measurement visible. The small display must report a prolonged crossing as 15 or more, so it cannot wrap around and make a long event look brief.

## Required behavior

clk, synchronous active-high reset, active, and done are one bit; duration is four bits. Count the rising edges that sample active=1. At the first edge sampling active=0 after an event with at least one active sample, report its length and set done=1 for one clock interval. Otherwise done is 0.

Counts saturate at 15. Keep the last published duration until another event ends. Reset clears the measurement, report, and done. An idle edge with no event before it must not produce a report.

Samples 1,1,1,0,0 report duration 3 on the fourth edge with done=1; the fifth edge clears done and retains duration 3.

## Before you code

Which values describe the event currently being measured, and which describe the event already reported? Can one register safely represent both?

## Check your reasoning

Test a one-cycle event, two events separated by one idle edge, and an 18-cycle event. Explain when the report changes and when it holds.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
