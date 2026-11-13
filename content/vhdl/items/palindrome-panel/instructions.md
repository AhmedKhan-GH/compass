A theatre lighting designer is preparing scenes that use an eight-lamp arch above the stage. For some scenes, the lights need to form a balanced pattern, with each lit or dark position matching the one opposite it. You will give the lighting desk a way to check that symmetry as the pattern changes, so the designer can tell whether an adjustment has disturbed the balance.

## Required behavior

`panel[7:0]` describes the row from left to right. Set the one-bit output `mirrored` to `1` when reversing all eight positions leaves the pattern unchanged, and to `0` otherwise. Zeroes at either end still represent lamp positions.

| Pattern | Mirrored? |
| --- | --- |
| `00000000` | 1 |
| `10000001` | 1 |
| `01100110` | 1 |
| `00000001` | 0 |
| `10001001` | 0 |
| `10101010` | 0 |

The answer must follow the current input without a clock or memory.

## Before you code

Which positions must agree with each other? Why can two equal four-bit halves still fail the mirror test?

## Check your reasoning

Predict the result for `00011000` and `00010000` before running tests. Changing one middle lamp can break the symmetry.

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
