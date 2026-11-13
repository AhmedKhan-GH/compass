The small and large display kits need the same behavior at different widths. A **parameter** sets that kind of configuration before simulation starts. It is not an input that changes while the circuit runs.

For example, this module has as many input and output wires as its `WIDTH` parameter requests:

```verilog
module example #(parameter WIDTH = 4) (
    input wire [WIDTH-1:0] data,
    output wire [WIDTH-1:0] copy
);
    assign copy = data;
endmodule
```

A `localparam` names an internal constant that an instance cannot override. A constant declared with `WIDTH` bits is limited to that width, so any truncation is clear. Use the configured width throughout the design; a fixed eight-bit intermediate can break the smaller kit.
