Both greenhouse sensors keep producing readings even when only one is displayed. A **multiplexer**, or mux, chooses which input word reaches an output. Both input circuits exist at the same time.

```verilog
assign display = use_backup ? backup : primary;
```

When the condition before `?` is `1`, the result is the value just after `?`. When it is `0`, the result is the value after `:`. Both choices should have the width the output needs.

A comparison can be the condition. You can also put another conditional expression inside either choice. For a chain of choices, work out which one should win when more than one condition is true.
