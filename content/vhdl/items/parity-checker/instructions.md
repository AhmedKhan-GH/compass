A weather station sends readings along a cable to a display indoors, where a changed bit could make the reported temperature look very different from the sensor's reading. The receiver needs a small check that can flag some of these damaged messages. You will provide a parity bit and check received readings against it, while exploring which changes can still pass unnoticed.

## Required behavior

Input `data` is eight bits. Input `received_parity` and outputs `generated_parity` and `error` are one bit. Choose `generated_parity` so the byte plus that bit contains an even number of ones. Set `error=1` when `received_parity` does not match the bit this rule requires; otherwise set it to `0`.

For `data=00000111`, the generated bit is `1`. Received parity `1` is accepted; received parity `0` sets `error=1`. Both outputs follow the current inputs.

## Before you code

If the byte already contains an even number of ones, what extra bit preserves that property? What if it contains an odd number?

## Check your reasoning

Predict what happens after flipping one data bit while keeping parity fixed. Then flip two data bits: can this scheme detect every error?

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
