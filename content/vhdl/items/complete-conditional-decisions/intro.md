A `process(all)` models combinational decisions. Assign safe defaults first, then override them in nested `if` statements so every path drives both outputs. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

A combinational process can contain ordered statements. Defaults at the top cover every path before more specific conditions override them:

```vhdl
process(all)
begin
    heater_on <= '0';
    level <= "00";

    if demand = '1' and safe = '1' then
        heater_on <= '1';
        level <= "01";
    end if;
end process;
```

`all` asks the simulator to react to every signal read by the process. Assigning both outputs before the `if` prevents an unintended latch when the condition is false.
