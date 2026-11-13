An `always @*` procedure can describe the fan's choices. In Verilog-2005, a signal assigned inside a procedure is declared with `reg`. Despite the name, `reg` does not by itself mean the circuit stores a value.

```verilog
always @* begin
    light = 1'b0;
    if (door_open) begin
        light = 1'b1;
    end
end
```

`@*` runs the procedure when a signal it reads changes. Blocking assignment, `=`, updates a value before the next statement uses it. Here, the first assignment covers the closed-door case. If a possible path leaves an output unassigned, that output keeps its old value: the circuit needs a latch. To describe combinational logic, assign each output on every path. You can use a default assignment or an `else` for the other case.
