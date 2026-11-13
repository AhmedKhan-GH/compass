A Verilog **task** packages repeated actions. Unlike a function, a task can contain timing controls and can change testbench signals. Declare it outside the initial block and give its inputs explicit widths.

```verilog
task show_after_falling_edge;
    input [7:0] label;
    begin
        @(negedge clk);
        $display("label=%h observed=%h", label, q);
    end
endtask
```

Calling a task does not by itself create another process. Put calls in separate `fork` branches to run them at the same time. Keep input timing consistent across calls and combine the check results into one final verdict.

You will use tasks to repeat the repair shop's register checks.
