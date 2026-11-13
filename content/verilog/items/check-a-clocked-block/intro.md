The repair bench must check both a register's value and when it changes. Start by controlling the clock and choosing when to drive inputs and read outputs.

With `` `timescale 1ns/1ps``, `always #5 clk = ~clk;` makes a clock with a 10 ns period. Initialize `clk` first so it starts at a known value.

Change data away from the edge that captures it. `@(posedge clk)` waits for a rising edge, but the register's nonblocking update happens later in that same simulation time. Waiting `#1` after the edge lets the checker see the updated output.

A separate `initial` block can act as a **watchdog**: it reports `CHECK_FAIL` and finishes after a fixed time if the checks get stuck. These timing controls run in the simulation; they do not add delay circuits to the DUT.
