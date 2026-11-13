The mountain hut has fitted a wider temperature display, and it looks fine until the weather turns cold: a sensor reading of -2 appears as 254. The extra display space should not change the temperature, so the fault lies in the supplied adapter's conversion. You will trace how the reading changes and repair the adapter so it preserves both positive and negative values.

## Required behavior

Input `temperature` is signed and eight bits wide. Output `displayed` is signed and twelve bits wide; it must represent the same number. Set the one-bit output `below_zero=1` for negative temperatures and `0` otherwise. There is no clock.

Temperature `-2` has the eight-bit pattern `11111110` and must display as `111111111110`. Zero must display as twelve zeroes and set `below_zero=0`.

## Before you code

Write the same negative number as eight bits and as twelve bits. Where does the faulty output first differ from the expected pattern?

## Check your reasoning

Check the minimum negative input, -1, zero, and the largest positive input. The fix should work across the range, not only for `-2`.

Keep the supplied module interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
