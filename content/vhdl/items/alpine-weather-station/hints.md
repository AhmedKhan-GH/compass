## 1. Recover the field's signed meaning

A part-select is unsigned. Interpret the eight selected bits with `$signed` before allowing the signed destination to extend them.

## 2. Preserve the correction's positive range

Do not interpret the original eight-bit calibration directly as signed. Give it leading zero bits in a sufficiently wide value, then make that value signed. Use signed values on both sides of the addition.

## 3. Widen before multiplication

The largest product is 382000 and the smallest is -128000. Use a wide signed intermediate and a signed, explicitly sized scale factor. Do not store the product in a ten-bit temporary.
