The bin counter has a limited number of positions for each result. An unsigned eight-bit word represents values `0` through `255`. `+` and `-` describe arithmetic hardware; `<`, `>`, `<=`, and `>=` compare numeric values and produce one-bit answers. Equality `==` asks whether values match.

A destination that is too narrow loses the extra high bits. For example, storing `14 + 3` in four bits gives `1`: only the low four bits of `17` remain. Subtracting below zero also wraps in an unsigned result. The value wraps around; it does not stop at the largest or smallest value.
