Concatenation uses `&`, and a slice uses a range such as `(1 downto 0)`. An internal vector can gather fields before individual positions are exposed again. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

The `&` operator concatenates fields from left to right, while `downto` gives a vector descending index bounds:

```vhdl
signal packet : std_logic_vector(5 downto 0);

packet <= valid & kind & payload;
kind_seen <= packet(4 downto 3);
```

These declarations belong before the architecture `begin`; assignments belong after it. The widths on both sides of each assignment must match.
