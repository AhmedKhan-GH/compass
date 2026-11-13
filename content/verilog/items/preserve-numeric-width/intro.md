The new bin display needs to keep the extra bit the old display lost. Make room for the result while calculating it, not only at the final output. Two unsigned eight-bit values can add up to `510`, which needs nine bits.

Adding zeroes on the left gives an unsigned value more bit positions without changing its number:

```verilog
wire [4:0] wider;
assign wider = {1'b0, small_word};
```

Here, `small_word` has four bits. Widening a value before using it in a calculation makes room for a larger result. You can then select only the low bits when needed and report any extra high bits separately.
