An operator checking two parts bins uses a service display to compare their quantities and calculate a total and difference. The existing display accepts only eight bits for each result, so numbers that do not fit wrap around and can look surprising. You will first match that existing behavior and add separate comparison flags; a later upgrade will give the full total enough room.

`a` and `b` are unsigned eight-bit bin quantities. The outputs `sum` and `difference` are eight bits. The outputs `a_less_b` and `equal` are one-bit comparison flags.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Calculate wrapping results

The service display already has a fixed eight-bit connection for each arithmetic result. Build the total and difference it expects, including the wrap that the operator will see when a result does not fit.

The output `sum` reports `a` plus `b`, and `difference` reports `a` minus `b`. Both keep only the low eight bits. Thus `250 + 10` reports `4`, and `3 - 5` reports `254`.

**Reason it through:** Which results do not fit in eight bits? What remains when the higher bits are lost?

**Check your reasoning:** Try a sum just below 256 and one just above it. Explain why the eight-bit result jumps back to a small value.

## 2. Compare the unsigned readings

The operator also needs to know which bin has fewer parts and whether the quantities match. Add separate comparison flags based on the original readings, so wrapped arithmetic cannot give a misleading answer.

Set `a_less_b=1` when the unsigned value of `a` is less than `b`, and `equal=1` when the values match. Otherwise, set the corresponding output to `0`.

**Reason it through:** If the wrapped difference is large, does that prove A was greater? Find inputs that show why not.

**Check your reasoning:** Use a=3 and b=5, then equal values and the reversed pair. Inspect the comparison outputs independently of wrapped arithmetic.
