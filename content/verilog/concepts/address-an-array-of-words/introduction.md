An **unpacked array** stores several words. Use an index to choose one:

```verilog
reg [3:0] entries [0:2];
```

The range before the name sets the width of each word. The range after it numbers the words in the array. Here, `entries[1]` selects the second four-bit word.

A packed vector is instead one wide word. To select a fixed-width part at a variable position, use an indexed part select: `bus[offset +: 4]` selects four bits starting at offset and extending toward larger bit numbers.

This exercise uses fixed initialized table contents. The next memory lesson adds writes and clocked reads.
