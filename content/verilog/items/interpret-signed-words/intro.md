The thermometer needs values below zero. An eight-bit two’s-complement value ranges from `-128` through `127`. The same pattern can mean different numbers under different interpretations: `11111111` is unsigned `255` but signed `-1`.

Declare values as `signed` when their calculations and comparisons need to treat them that way:

```verilog
wire signed [3:0] offset;
wire signed [7:0] expanded;
```

To widen a signed value without changing its number, fill the new high positions with copies of its sign bit. For example, four-bit `1101` (-3) becomes eight-bit `11111101` (-3). Filling those positions with zeroes would give positive 13 instead. The sign is already part of the bit pattern; declaring `signed` does not add another wire.
