A clocked testbench must control when it drives and observes signals. Under `` `timescale 1ns/1ps``, toggling a clock with `always #5 clk = ~clk;` gives a 10 ns period. Initialize the clock first.

Change the inputs before the clock edge that captures them. An event control such as `@(posedge clk)` waits for that edge, but nonblocking register updates occur later in the same simulation time. With this 10 ns clock, waiting `#1` afterward gives the simulator time to update the output before you check it.

A second `initial` block can set a time limit. If the checks have not finished by then, print `CHECK_FAIL` and end the simulation. This timeout block is often called a watchdog. Testbench timing controls do not add delays to the DUT’s hardware.
