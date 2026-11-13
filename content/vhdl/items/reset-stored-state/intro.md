A synchronous reset is tested inside `rising_edge`; an asynchronous reset belongs in the sensitivity list and is tested before the edge branch. Clocked signal assignments schedule new values together after the active edge; code later in the same process therefore reads the old stored values. Branch order expresses reset and control priority.

Reset timing follows the process structure. A synchronous reset is sampled only at the edge, while an asynchronous reset is in the sensitivity list and tested first:

```vhdl
process(clk, async_clear)
begin
    if async_clear = '1' then
        stored <= (others => '0');
    elsif rising_edge(clk) then
        stored <= next_value;
    end if;
end process;
```

For synchronous reset, use `process(clk)`, enter `if rising_edge(clk)`, and test reset inside that branch. The distinction is observable between clock edges.
