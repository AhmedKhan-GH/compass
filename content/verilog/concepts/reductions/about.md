A **reduction** combines a whole vector into one answer. Unary `|word` asks whether any bit is 1, `&word` whether every bit is 1, and `^word` whether an odd number of bits are 1.

These differ from binary bitwise operations, which produce a word. Logical `!word` also produces one bit: 1 only when the entire word is zero. Applying logical NOT twice turns any known nonzero word into 1, while zero stays 0.

For example, a three-bit word 101 contains two ones: `|word` is 1, `&word` is 0, and `^word` is 0.
