## 1. Pack the named fields

Convert the integer through `to_signed(..., 8)`; humidity uses `to_unsigned(..., 7)`.

## 2. Unpack a complete record

Slice the word, convert with `signed` or `unsigned`, and use `to_integer`.
