The locker display needs one answer about several compartments. A **reduction** combines a whole vector into one answer. Unary `|word` asks whether any bit is `1`, `&word` whether every bit is `1`, and `^word` whether an odd number of bits are `1`.

A reduction produces one bit; a bitwise operation produces a word. Logical NOT, `!word`, also produces one bit. For known binary inputs, it gives `1` when the word is zero and `0` otherwise. Applying it twice gives `0` for a zero word and `1` for a nonzero word.

For example, `101` contains two ones. At least one bit is set, but not all of them are. Its odd-parity result is `0` because two is an even number.
