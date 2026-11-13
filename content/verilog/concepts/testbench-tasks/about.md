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

Calling a task does not by itself create another process. Put calls in separate `fork` branches to run them at the same time. Use the same input timing for each call and collect all check results before reporting one final pass or fail.
