A bakery's collection counter uses a small seven-segment display to show a decimal digit. Each number needs a different pattern of lit segments, and a code outside the decimal range should leave the display blank rather than show customers a misleading number. You will use the segment wiring diagram to translate the incoming code into the correct visible digit and indicate whether that code is valid.

## Required behavior

`digit` is a four-bit input. Output `segments[6:0]` corresponds to a, b, c, d, e, f, g in that order; `1` lights a segment. The one-bit output `valid` says whether the input is a decimal digit.

```text
  -- a --
 f       b
  -- g --
 e       c
  -- d --
```

| digit | segments | valid |
| --- | --- | --- |
| 0 | 1111110 | 1 |
| 1 | 0110000 | 1 |
| 2 | 1101101 | 1 |
| 3 | 1111001 | 1 |
| 4 | 0110011 | 1 |
| 5 | 1011011 | 1 |
| 6 | 1011111 | 1 |
| 7 | 1110000 | 1 |
| 8 | 1111111 | 1 |
| 9 | 1111011 | 1 |
| 10–15 | 0000000 | 0 |

Outputs follow the current digit with no memory.

## Before you code

Draw digit 2 using the labeled segments. Does the bit order in your pattern agree with the physical drawing?

## Check your reasoning

Change from digit 8 to code 10, then to digit 1. Check that code `10` turns every segment off and clears `valid`, then that digit `1` lights the correct segments.

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
