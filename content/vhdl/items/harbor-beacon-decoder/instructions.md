A model harbor receives four-bit beacon messages. Decode a candidate family while keeping simulation uncertainty visible, then publish the family only after every message bit is known.

## 1. Identify a candidate announcement

In priority order, match `00--` as family 1, `01--` as family 2, and `1---` as family 3. Use `std_match(message, pattern)`: a `'-'` in the pattern ignores that position, while an `X` or `Z` in a required message position does not match. Assign family 0 when no pattern matches.

## 2. Recognize a complete simulated word

Set `word_known` to `'0'` whenever `is_x(message)` is true and to `'1'` otherwise. This diagnostic must itself always be a definite zero or one.

## 3. Publish only a complete announcement

Drive `accepted_family` with the candidate only when `word_known` is `'1'`. Drive `"00"` for every incomplete message, even if its known prefix suggested a family.
