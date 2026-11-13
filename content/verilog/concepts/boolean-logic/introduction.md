A combinational circuit decides its outputs from the current inputs. A **gate** combines or changes bits:

| Operation | Verilog | When its result is 1 |
| --- | --- | --- |
| NOT | `~a` | `a` is 0. |
| AND | `a & b` | Both inputs are 1. |
| OR | `a \| b` | At least one input is 1, including both. |

For example, this separate circuit lights a warning whenever either sensor detects smoke:

```verilog
assign warning = sensor_left | sensor_right;
```

Expressions can be combined. Parentheses show which parts of an expression belong together. Two output assignments describe circuits that operate at the same time; one output wire may feed another part of the circuit.
