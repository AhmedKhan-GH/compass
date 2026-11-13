The new water cabinet can reuse a comparison circuit that already works. A **module instance** puts a copy of a smaller circuit inside a larger one. The copy keeps responding to its inputs; it is not a function that runs once and returns.

Named ports show how the two circuits connect:

```verilog
indicator lamp (
    .control(enable_wire),
    .lit(status_wire)
);
```

The name after the dot is a port on the child module. The name in parentheses is a signal in the parent module. Each instance has its own hardware, and its outputs can feed other logic in the parent. Give a connection one intended driver rather than adding another assignment to the child's output.
