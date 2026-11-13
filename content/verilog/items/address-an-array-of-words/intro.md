The organ's presets and its calibration card both contain bytes, but they store them in different forms. An **unpacked array** lets you address each word separately:

```verilog
reg [3:0] entries [0:2];
```

The range before the name gives the width of one word. The range after it gives the array's indices. `entries[1]` selects one whole word.

A packed vector is one wide word. An indexed part-select picks a fixed-width piece from it: `bus[offset +: 4]` selects four bits starting at `offset` and moving toward higher bit numbers.

This exercise starts with fixed table contents. The next memory lesson adds writes and reads that wait for a clock edge.
