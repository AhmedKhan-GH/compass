## 1. Assign every procedural path

Use a default and a conditional update, or equivalent complete logic. A VHDL `if` does not take its true branch for a one-bit `x` or `z` condition.

## 2. Let the conditional operator merge bits

The `?:` operator already provides the required bit-by-bit merging for an unknown selector. An ordinary procedural branch does not perform that merge.

## 3. Compare simulation states, not only binary values

Case equality (`===`) compares 0, 1, `x`, and `z` literally. Ordinary equality can return `x`, which is not a definite answer to this diagnostic question.
