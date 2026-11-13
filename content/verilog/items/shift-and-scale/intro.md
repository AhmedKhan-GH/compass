A shift moves bits left or right. Logical shifts `<<` and `>>` fill the empty positions with zeroes. Bits that move beyond the destination's width are lost.

Arithmetic right shift, `>>>`, fills the empty positions with copies of the sign bit when the value being shifted is signed. For example, signed four-bit -3 (`1101`) shifted right by one becomes -2 (`1110`). For negative odd values, this rounds down rather than toward zero.

Shifting can multiply or divide by powers of two. Check the signedness, available bits, and rounding before treating a shifted pattern as the numeric answer you expect.
