A shift moves bits to different positions. Logical left `<<` and right `>>` shifts fill the newly vacated positions with zero. Bits pushed beyond the destination are lost.

For a signed left operand, arithmetic right `>>>` repeats the sign bit instead of inserting zeroes. For example, signed four-bit -3 (1101) shifted right by one becomes -2 (1110). This rounds negative odd values downward, not toward zero.

Shifting can multiply or divide by powers of two. Check whether the input is signed and whether the result has enough bits to keep the answer.
