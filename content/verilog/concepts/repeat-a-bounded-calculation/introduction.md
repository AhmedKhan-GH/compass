A procedural loop can repeat a calculation a fixed number of times. In this course its limit is fixed when the circuit is built; it does not consume one clock cycle per loop iteration.

```verilog
integer index;
always @* begin
    reversed = 4'b0000;
    for (index = 0; index < 4; index = index + 1) begin
        reversed[index] = incoming[3-index];
    end
end
```

Declare the integer index outside the loop in Verilog-2005. Blocking assignments let the next step use values calculated in the current step. Set a running total to its starting value each time the block runs, so it does not keep adding to the previous result.
