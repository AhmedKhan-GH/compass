Each workshop bench needs its own copy of the permission logic. A **generate loop** creates those copies when the design is built, a stage called elaboration. Its `genvar` is an index used to build the structure, not a counter running in the circuit.

```verilog
genvar lane;
generate
    for (lane = 0; lane < CHANNELS; lane = lane + 1) begin : copies
        assign connected[lane] = incoming[lane];
    end
endgenerate
```

A generate-if chooses a structure using a constant such as a parameter. Changing a request input later does not switch the generated structure. Name the generated blocks so you can find each copy in the circuit hierarchy.

For groups wider than one bit, an indexed part-select picks a fixed number of bits: `bus[lane*4 +: 4]` selects four bits starting at `lane*4`. Lane 0 selects bits 3:0; lane 1 selects bits 7:4. The starting position changes, but the group width stays fixed.
