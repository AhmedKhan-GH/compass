A **parameter** chooses a hardware configuration before simulation starts. It is not a runtime input. Changing a width parameter changes the number of wires in the circuit.

```verilog
module example #(parameter WIDTH = 4) (
    input wire [WIDTH-1:0] data,
    output wire [WIDTH-1:0] copy
);
    assign copy = data;
endmodule
```

A `localparam` names a constant inside a module that an instance cannot override. A `WIDTH`-bit declaration tells Verilog how many bits of a constant to keep. Check small widths too: an expression that works for eight bits may not work for one.
