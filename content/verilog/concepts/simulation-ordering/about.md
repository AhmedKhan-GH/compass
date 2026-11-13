# Photo finish

Repair a finish-line camera checker that mistakes the previous runner for the current one.

A clock edge does not make every simulator process finish at once. When a clocked block evaluates `q <= data`, the simulator first evaluates the right-hand side and schedules an update. Another process awakened by that same edge can still read the previous `q`.

A testbench has two separate jobs: provide stable inputs before the sampling edge, and observe results after scheduled updates have happened. For a clock with a 10 ns period, driving on its falling edge and observing 1 ns after its rising edge gives each job a clear window.

```verilog
// An observation in an unrelated temperature-register checker.
@(posedge sample_clock);
#1;
$display("temperature now = %0d", measured_temperature);
```

`#0` advances to the inactive part of the current time slot; it does not wait past the nonblocking-assignment update. Here, a small positive delay gives the checker time to see the updated value. Keep this delay in the testbench.

A task can return a result through an `output` argument. Use a four-state comparison when an unknown hardware value should make a check fail instead of making the check itself unknown.
