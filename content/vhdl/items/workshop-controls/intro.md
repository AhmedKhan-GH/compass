First Light gave a model an output; Exhibit Switch added an input and connected it directly. This workshop keeps that same boundary, but its outputs now depend on decisions about several inputs. The supplied ports are the connections you already know. The new idea is how logic inside the model combines their values.

The VHDL operators `not`, `and`, and `or` work directly on `std_logic`. Parentheses make the shared lock condition explicit when both buttons feed one decision. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

Words such as `and`, `or`, and `not` are VHDL operators. Parenthesize the alternatives before applying a shared permission:

```vhdl
ready <= not locked;
run_lamp <= (front_button or rear_button) and not locked;
```

Each expression produces one `std_logic` result. Concurrent assignments recalculate when any input in their expression changes.
