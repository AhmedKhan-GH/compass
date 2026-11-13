A **multiplexer**, or mux, chooses which input word reaches an output. Both input circuits exist at the same time.

```verilog
assign display = use_backup ? backup : primary;
```

The condition before `?` chooses the next value when it is 1 and the value after `:` when it is 0. The alternatives should have the intended output width.

A comparison can supply the condition. An alternative can itself be another conditional expression, giving several choices. The first satisfied condition has priority, so describe what should happen when controls overlap before writing nested expressions.
