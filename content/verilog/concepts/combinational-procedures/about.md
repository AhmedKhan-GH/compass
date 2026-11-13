An `always @*` block is another way to describe combinational logic. Outputs assigned inside the block use `reg` in Verilog-2005. Despite its name, `reg` does not by itself mean the circuit stores a value.

```verilog
always @* begin
    light = 1'b0;
    if (door_open) begin
        light = 1'b1;
    end
end
```

`@*` runs the block again when an input it reads changes. A blocking assignment (`=`) updates a value before the next statement runs. In this example, the first assignment keeps the light off when the door is closed. If a combinational block leaves an output unassigned for some inputs, that output must keep its old value. This creates storage called a latch. You can use an `else` to give the output a value in the remaining case.
