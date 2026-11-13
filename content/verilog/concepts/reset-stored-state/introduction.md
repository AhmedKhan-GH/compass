A reset puts stored values into a known starting state. A **synchronous reset** is sampled by the same clock edge as ordinary data. An **asynchronous reset** can clear storage when reset becomes active, even without a clock edge.

```verilog
always @(posedge clock or posedge clear_now) begin
    if (clear_now) begin
        stored <= 4'd0;
    end else begin
        stored <= incoming;
    end
end
```

This example responds as soon as reset goes high but still loads ordinary data only at rising clock edges. Removing the reset edge from the event list describes synchronous reset behavior. Lowering reset alone does not load a new sample.
