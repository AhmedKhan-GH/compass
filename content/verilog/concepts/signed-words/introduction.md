An eight-bit two’s-complement value ranges from -128 through 127. The same pattern can mean different numbers under different interpretations: 11111111 is unsigned 255 but signed -1.

Declare signed operands explicitly when their comparisons should use that interpretation:

```verilog
wire signed [3:0] offset;
wire signed [7:0] expanded;
```

To widen a signed value without changing it, repeat the original sign bit in the new high positions. For example, four-bit 1101 (-3) becomes eight-bit 11111101 (-3). Zero-extension would instead turn it into positive 13. A `signed` declaration changes numeric interpretation; it does not add a separate sign wire.
