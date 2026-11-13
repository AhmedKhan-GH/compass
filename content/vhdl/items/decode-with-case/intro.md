A combinational `case` statement must cover every value; `when others` handles unused encodings and prevents retained outputs. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

A `case` chooses exactly one branch from a discrete selector. Include `when others` so every possible `std_logic_vector` value is covered:

```vhdl
process(all)
begin
    lamp <= "0000";
    case command is
        when "00" => lamp <= "0001";
        when "01" => lamp <= "0010";
        when others => lamp <= "0000";
    end case;
end process;
```

The default before the case also documents the safe value. A branch may contain several sequential assignments when multiple outputs belong to one decoded choice.
