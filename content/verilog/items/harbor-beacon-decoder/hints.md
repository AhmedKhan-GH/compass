## 1. Use the intended wildcard rules

`casez` ignores `z`/`?` positions in either operand. `casex` would also ignore significant `x` values and hide the missing information this task is meant to show. Include the default result and preserve the specified case order.

## 2. Reduce the whole word before comparing

Reduction XOR becomes `x` when any bit is `x` or `z`. Case inequality against `1'bx` gives a definite result. Ordinary inequality might itself return `x`.

## 3. Keep classification and acceptance separate

Use the complete-word diagnostic to select either the candidate family or zero. Do not bypass the diagnostic merely because the candidate is nonzero.
