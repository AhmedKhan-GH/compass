A motion-sensor demonstration shows readings at two different scales: one view doubles an unsigned movement reading to make small changes easier to see, while another halves a signed offset from the center position. Both displays have limited space and show only whole numbers. You will build the two conversions, accounting for the information lost when a value is too large or falls between whole numbers.

Input `sample` is an unsigned byte, and input `signed_sample` is an independent signed byte. Output `doubled` is eight bits; output `discarded` reports the lost high bit. Output `halved` is a signed byte. You are building the two scale conversions, not measuring movement or remembering earlier readings.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Shift left and report loss

The first view doubles the movement reading to make small changes easier to see. Its output still has only eight bits. Build the scaled value and preserve an indication of any bit that no longer fits.

The output `doubled` is twice the unsigned `sample`, keeping only the low eight bits. The one-bit output `discarded` reports the original high bit that does not fit after doubling.

**Reason it through:** Which bit is lost at the high end, and what enters the lowest position?

**Check your reasoning:** For sample=10000011, expect doubled=00000110 and discarded=1. Compare this with a value whose top bit is zero.

## 2. Arithmetic-shift a signed value

The second view halves the offset from the center position. Offsets can be negative, and the display has no fractional positions. Build this conversion using the stated rounding rule without losing the sign.

The signed output `halved` reports `signed_sample` divided by two, rounded down toward negative infinity. For `-5` the answer is `-3`; for `+5` it is `+2`.

**Reason it through:** Which value should fill the new top position to keep a negative reading negative?

**Check your reasoning:** Compare -5, -4, 0, and +5. Inspect the bits as well as the signed numeric answer.
