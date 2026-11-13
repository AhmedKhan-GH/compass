An event control and a condition wait ask different questions:

- `@(posedge ready)` waits for a future rising transition. If `ready` is already high, it still waits for another transition.
- `wait (ready === 1'b1)` continues immediately if the condition is already true; otherwise it waits until the condition becomes true. The explicit comparison treats an unknown as not ready.

A testbench may also need to stop waiting after a set amount of time. A loop can sample a status signal a limited number of times and return a timeout result if none of those samples sees readiness.

```verilog
// In an unrelated status logger, take four samples one unit apart.
repeat (4) begin
    #1;
    $display("status=%b", status);
end
```

The `timescale` directive sets the unit used by delays. With `` `timescale 1us / 1ns ``, `#1` means one microsecond; `#0.5` means half a microsecond, rounded to the declared precision. A testbench should state both its sampling interval and its deadline clearly.
