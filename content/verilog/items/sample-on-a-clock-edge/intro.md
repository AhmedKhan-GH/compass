The training monitor needs to keep a reading after the sensor changes. A **register** stores a value between clock edges. A rising edge is the clock's change from `0` to `1`; a clocked procedure describes the update at that edge:

```verilog
always @(posedge clock) begin
    stored <= incoming;
end
```

Use nonblocking assignment, `<=`, for these register updates. Each right-hand side uses the value available before the stored values update. This lets a second register keep the preceding sample instead of immediately copying the new one.

Keep the starter's reset branch: a high reset at a rising edge clears the stored values. The next reset lesson explores when a reset can act without waiting for the clock.
