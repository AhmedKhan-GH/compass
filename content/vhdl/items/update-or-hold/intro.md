A clocked process can hold state simply by making no assignment. Put reset first, then permit loading only when load is asserted and freeze is clear. Clocked signal assignments schedule new values together after the active edge; code later in the same process therefore reads the old stored values. Branch order expresses reset and control priority.

A register holds its old value when a rising-edge branch makes no assignment. Arrange conditions from highest to lowest priority:

```vhdl
process(clk)
begin
    if rising_edge(clk) then
        if reset = '1' then
            stored <= (others => '0');
        elsif enable = '1' then
            stored <= input_data;
        end if;
    end if;
end process;
```

There is no `else` after enable, so the storage retains its value when loading is disabled. Additional controls can refine the enable expression without creating combinational storage.
