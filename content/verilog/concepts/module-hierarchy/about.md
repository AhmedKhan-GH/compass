A module instance places a reusable circuit inside a larger one. It is a hardware component, not a function that runs once and returns.

Named ports make the two sides of a connection clear:

```verilog
indicator lamp (
    .control(enable_wire),
    .lit(status_wire)
);
```

The name after the dot belongs to the child module; the name in parentheses belongs to the surrounding module. Every instance has its own hardware. A child output can feed another part of the parent circuit.
