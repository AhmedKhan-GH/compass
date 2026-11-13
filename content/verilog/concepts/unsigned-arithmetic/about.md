An unsigned eight-bit word represents values 0 through 255. `+` and `-` describe arithmetic hardware; `<`, `>`, `<=`, and `>=` compare numeric values and produce one-bit answers. Equality `==` asks whether values match.

A destination with too few bits discards the excess. For example, an unsigned four-bit result for 14 + 3 is 1, because only the low four bits of 17 remain. Subtraction below zero also wraps in an unsigned fixed-width result. This behavior is called wrapping. Saturation is different: it holds the result at the largest or smallest allowed value.
