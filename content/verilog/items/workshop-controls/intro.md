First Light gave a model an output; Exhibit Switch added an input and connected it directly. This workshop keeps that same boundary, but its outputs now depend on decisions about several inputs. The supplied ports are the connections you already know. The new idea is how logic inside the model combines their values.

The conveyor controls depend on the buttons and lock as they are now. A combinational circuit decides its outputs from the current inputs. A **gate** combines or changes bits:

| Operation | Verilog | When its result is 1 |
| --- | --- | --- |
| NOT | `~a` | `a` is 0. |
| AND | `a & b` | Both inputs are 1. |
| OR | `a \| b` | At least one input is 1, including both. |

For example, this circuit lights a warning whenever either sensor detects smoke:

```verilog
assign warning = sensor_left | sensor_right;
```

You can combine these operations in one expression. Parentheses show which parts belong together. Separate assignments describe circuits that work at the same time, and one output wire can connect to another part of the circuit.
