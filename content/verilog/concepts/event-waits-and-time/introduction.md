An event control and a condition wait ask different questions:

- `@(posedge ready)` waits for a future rising transition. If `ready` is already high, it still waits for another transition.
- `wait (ready === 1'b1)` continues immediately if the condition is already true; otherwise it waits until the condition becomes true. The explicit comparison treats an unknown as not ready.

A testbench should not always wait forever. It can check a status signal at fixed intervals and stop after a chosen number of checks. If none finds the device ready, report a timeout.

```verilog
// In an unrelated status logger, take four samples one unit apart.
repeat (4) begin
    #1;
    $display("status=%b", status);
end
```

The delay unit comes from `timescale`, not from a signal's name. With `` `timescale 1us / 1ns ``, `#1` means one microsecond; `#0.5` means half a microsecond, rounded to the declared precision. A testbench should state both its sampling interval and its deadline clearly.
