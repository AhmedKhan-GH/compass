A `process(clk)` with `rising_edge(clk)` describes edge-triggered storage. Signal assignments take effect after the process suspends, so `previous <= captured` records the pre-edge value. Clocked signal assignments schedule new values together after the active edge; code later in the same process therefore reads the old stored values. Branch order expresses reset and control priority.

A clocked process wakes on clock events and changes storage only on the rising edge. Signal assignments inside it all read pre-edge values:

```vhdl
process(clk)
begin
    if rising_edge(clk) then
        older <= newest;
        newest <= sensor_data;
    end if;
end process;
```

Both assignments take effect after the process suspends, so `older` receives the value that `newest` held before the edge. Put synchronous reset handling inside the rising-edge branch.
