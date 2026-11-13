A technician tests a freezer through both cooling and defrost trials, so an acceptable temperature in one trial may be wrong for the next. Some allowed ranges stay below zero, while others cross it. You will build a check that uses the limits supplied for the current trial, giving the technician a clear indication of whether the reading is acceptable or should raise an alarm.

## Required behavior

Inputs `temperature`, `minimum`, and `maximum` are signed eight-bit values, with `minimum ≤ maximum`. Set the one-bit output `acceptable=1` for readings between the limits, including both endpoints, and `0` otherwise. The one-bit output `alarm` must be its opposite.

For limits -10 and 5, readings -10, 0, and 5 are acceptable; -11 and 6 are not. Outputs follow the current inputs without storage.

## Before you code

Which cases could pass even if the comparison accidentally became unsigned? Choose cases that force the sign interpretation to matter.

## Check your reasoning

Check both endpoints, an all-negative range, and a range crossing zero. For a mismatch, compare the signed numbers as well as their bit patterns.

Keep the supplied module interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
