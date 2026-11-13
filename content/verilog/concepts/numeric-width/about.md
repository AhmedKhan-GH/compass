A correct arithmetic circuit needs space for intermediate results as well as final outputs. The largest sum of two eight-bit unsigned values is 510, which needs nine bits.

Adding zeroes on the left gives an unsigned value more bits without changing its number:

```verilog
wire [4:0] wider;
assign wider = {1'b0, small_word};
```

Here, `small_word` has four bits. Widen values before calculating when you need room for a larger result. A part select can keep just the low bits, while a separate output reports any high bits you need.
