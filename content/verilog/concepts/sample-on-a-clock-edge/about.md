A register preserves information between clock edges. A rising edge is the clock’s transition from 0 to 1. A clocked procedure describes what should change at that edge:

```verilog
always @(posedge clock) begin
    stored <= incoming;
end
```

Use nonblocking <= for these updates. Right-hand sides use the values from before the edge; the register updates are scheduled together. This lets a chain of registers remember a sequence of samples. Each register gets the previous value from the stage before it.

The starter supplies a reset branch. For now, retain it: reset high at a rising edge clears the stored values. A later lesson explores different reset timing.
