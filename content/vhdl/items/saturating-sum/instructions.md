An arcade game combines the points from two challenges on a scoreboard whose numeric field stops at 255. A player who earns more than that should see the maximum score with an overflow badge, rather than watch the number wrap around to a smaller score. You will build that display rule while keeping an exact score of 255 distinct from one that exceeds it.

## Required behavior

Inputs `a` and `b` are unsigned eight-bit scores. The eight-bit output `result` reports their exact sum up to `255`. Above that, it stays at `255`. Set the one-bit output `saturated=1` only when the full sum exceeds `255`; otherwise set it to `0`.

For `200 + 55`, report `result=255` and `saturated=0`. For `200 + 56`, report `result=255` and `saturated=1`. Both outputs follow the current inputs.

## Before you code

How will you distinguish an exact total of 255 from one that overflowed? Which information must survive long enough to make that decision?

## Check your reasoning

Compare 255+0, 255+1, and 255+255. The scoreboard shows 255 in all three cases, but should the overflow badge appear in all of them?

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
