The same bits can represent different numbers. Their meaning depends on their width and whether Verilog treats them as signed or unsigned. In Verilog, a part-select such as `message[5:0]` is unsigned even when the original vector is signed. A concatenation is also unsigned.

`$signed(value)` changes how the existing bits are interpreted; it does not add bits. For example, the six-bit pattern `111101` represents 61 unsigned or -3 signed:

```verilog
wire signed [8:0] signed_height;
assign signed_height = $signed(message[5:0]);
```

Here the signed six-bit value is extended to the wider signed destination. Converting a six-bit unsigned value above 31 directly with `$signed` instead would turn it negative. To preserve a nonnegative value, first give it a leading zero bit, then interpret that wider pattern as signed.

When signed and unsigned operands meet, the unsigned operand can change the interpretation of the expression. Choose the width and signed or unsigned type of each operand **before** doing arithmetic. A signed destination alone does not repair every unsigned calculation.

Unsized decimal integers, such as `500`, are signed and at least 32 bits wide. Based literals have their own width and signedness rules; a spelling change can alter an expression. Use explicitly sized literals when precision matters, such as `18'sd500`.

Finally, an intermediate expression may discard bits before its result reaches a wide output. A signed wire with enough bits gives the intermediate result room to fit. Work out the smallest and largest possible results, then choose widths that can hold them.
