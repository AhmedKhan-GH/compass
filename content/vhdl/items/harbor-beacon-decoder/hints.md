## 1. Identify a candidate announcement

Default the candidate to `"00"`, then use an `if`/`elsif` chain of `std_match` calls. The don't-care belongs in the pattern operand.

## 2. Recognize a complete simulated word

`is_x` checks a `std_logic_vector` for values such as `X` and `Z`; invert that result to form the known-word flag.

## 3. Publish only a complete announcement

A conditional signal assignment can select the candidate for a known word and `"00"` otherwise.
