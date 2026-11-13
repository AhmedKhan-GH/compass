The same bits can represent different numbers depending on their width and whether they are treated as signed or unsigned. In Verilog, a part-select such as `message[5:0]` is unsigned even when the original vector is signed. A concatenation is also unsigned.

`$signed(value)` changes how the existing bits are interpreted; it does not add bits. For example, the six-bit pattern `111101` represents 61 unsigned or -3 signed:

```verilog
wire signed [8:0] signed_height;
assign signed_height = $signed(message[5:0]);
```

Here the signed six-bit value is extended to the wider signed destination. Converting a six-bit unsigned value above 31 directly with `$signed` instead would turn it negative. To preserve a nonnegative value, first give it a leading zero bit, then interpret that wider pattern as signed.

When signed and unsigned operands meet, the unsigned operand can change the interpretation of the expression. Choose each operand's width and signedness **before** doing arithmetic. A signed destination alone does not repair every unsigned calculation.

Unsized decimal integers, such as `500`, are signed and at least 32 bits wide. Based literals have their own width and signedness rules; a spelling change can alter an expression. Use explicitly sized literals when you need a specific width and sign, such as `18'sd500`.

Finally, an intermediate expression may discard bits before its result reaches a wide output. A named, suitably wide signed wire makes the intended calculation width visible. Work out the complete numeric range, then choose widths that can contain it.
