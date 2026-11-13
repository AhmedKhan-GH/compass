A bowling alley's pinsetter, the machine that puts pins back in place, can report a brief jam and recover before the attendant notices. Its maintenance light therefore needs to remember a sampled fault until the attendant acknowledges it, while still drawing attention to a fault that remains present. You are building this remembered warning so acknowledging an old problem cannot hide a current one.

## Required behavior

clk, synchronous active-high reset, fault, acknowledge, and alarm are all one bit. Evaluate controls at rising edges. Reset clears alarm. Otherwise a current fault sets it. Acknowledge clears it only when no fault is currently active. With neither control, retain the previous alarm.

Between rising edges alarm holds. A simultaneous fault and acknowledgement must leave the alarm set.

## Before you code

Which behavior requires memory rather than just a Boolean expression of the current inputs? Why must a current fault take priority over acknowledgement?

## Check your reasoning

Sample fault values 1,0,0 with no acknowledgement, then acknowledge. Also acknowledge on the same edge as a new fault and predict the difference.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
