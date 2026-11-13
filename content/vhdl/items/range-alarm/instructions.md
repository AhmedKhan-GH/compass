An aquarium keeper wants a warning when the water level moves outside an acceptable range, whether it is falling during a leak or rising as the tank is filled. The keeper chooses the lowest and highest acceptable readings, including the limits themselves. You will build the indicator and alarm that compare the current sensor reading with those settings, including when the keeper changes a limit.

## Required behavior

Inputs `sample`, `lower`, and `upper` are unsigned eight-bit values, with `lower ≤ upper`. Outputs `in_range` and `alarm` are one bit.

A sample at either limit is allowed. Below `lower` or above `upper`, set `alarm=1` and `in_range=0`. For every allowed sample, set `alarm=0` and `in_range=1`. Respond to changes in the sample or either limit without waiting for a clock.

## Before you code

List the outcomes just below, at, and just above both limits. When lower equals upper, how many sample values are acceptable?

## Check your reasoning

For limits 10 and 20, check 9, 10, 20, and 21. Then move a limit while holding the sample fixed; the outputs must respond.

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
