`std_logic` can represent unresolved and conflicting simulation values. Give each required output one definite driver and use equality only after the intended inputs are connected. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

Resolved `std_logic` shows connection mistakes during simulation. A definite single driver produces `'0'` or `'1'`, while missing or disagreeing drivers may produce values such as `'U'` or `'X'`:

```vhdl
connected_lamp <= source_switch;
inputs_match <= '1' when first_input = second_input else '0';
```

Do not hide an unknown by adding another driver. Repair the connection so each intended output has one clear source, then compare only the real input signals.
