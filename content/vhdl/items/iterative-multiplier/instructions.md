At a farm stand, the scale combines a whole-number quantity with a price-per-unit code to calculate the total. Because its small arithmetic unit reuses one adder over several clock edges, your implementation needs to keep the accepted values until the full result is ready, even if the inputs already show the next item.

## Required behavior

clk, synchronous active-high reset, start, busy, and done are one bit. Inputs a and b are eight-bit unsigned values; product is sixteen bits. Accept operands only on an idle start edge, clear the previous product, and raise busy.

Perform exactly eight subsequent work edges using a shift-and-add design. After the eighth, product must equal the full mathematical product, busy becomes 0, and done is 1 for one clock interval. Keep the completed result visible while idle. Starts or operand changes while busy do not replace the job. Reset cancels work and clears busy, done, and product.

3×5 must produce 15; 255×255 must produce 65025, hexadecimal FE01. Zero operands still use the specified eight work edges.

## From multiplication to repeated addition

Each 1 in a binary number contributes a power of two. For example, 5 is `00000101`: it contains one 1 and one 4. Therefore 3 × 5 is 3 × 1 plus 3 × 4. The two contributions are 3 and 12; their sum is 15.

Consider the multiplier bits from least significant to most significant. Each position selects whether its contribution belongs in the total. Moving to the next position doubles the contribution, which can be represented by a left shift.

For 3 × 5, the eight work edges have this mathematical trace:

| Work edge | Multiplier bit | Possible contribution | Contribution used | Running total |
| --- | --- | --- | --- | --- |
| 1 | 1 | 3 | 3 | 3 |
| 2 | 0 | 6 | 0 | 3 |
| 3 | 1 | 12 | 12 | 15 |
| 4 | 0 | 24 | 0 | 15 |
| 5 | 0 | 48 | 0 | 15 |
| 6 | 0 | 96 | 0 | 15 |
| 7 | 0 | 192 | 0 | 15 |
| 8 | 0 | 384 | 0 | 15 |

The circuit can reuse its adder because these contributions are handled on different edges. Decide which values must be stored, how wide they must be, and how the controller knows the last contribution has been processed.

## Before you code

Express one operand as a sum of powers of two. Which shifted contributions are needed for 3×5, and which state must persist between those contributions?

## Check your reasoning

Draw an eight-row work table, then compare it with Waveforms. Check that the final contribution is included on the same edge that reports done, and inspect Schematic for the intended reused arithmetic path.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
