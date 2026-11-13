A generate loop repeats parts of a circuit when the design is prepared for simulation or synthesis. This preparation is called elaboration. Its `genvar` numbers the copies; it does not count during circuit operation.

```verilog
genvar lane;
generate
    for (lane = 0; lane < CHANNELS; lane = lane + 1) begin : copies
        assign connected[lane] = incoming[lane];
    end
endgenerate
```

A generate-if selects a hardware structure using a constant such as a parameter. When offering two implementations of the same module, keep their input and output behavior the same. Named blocks make the generated pieces easier to find in the design hierarchy.

For lanes wider than one bit, an indexed part select chooses a fixed-size group: `bus[lane*4 +: 4]` selects four bits starting at position lane×4. Lane 0 selects bits 3:0, lane 1 selects 7:4, and so on. The group width is constant even though its starting position changes.
