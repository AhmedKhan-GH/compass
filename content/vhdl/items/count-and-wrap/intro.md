The irrigation controller must remember its current position before moving to the next one. A **counter** combines a register with the arithmetic for its next value. A three-bit unsigned count represents 0 through 7; adding one to 7 drops the carry and returns to 0.

That natural wrap is useful for the full display range. A shorter sequence needs its own rule for returning to zero at the last allowed value. The number of address bits does not decide how many real zones exist.

An enable controls whether the current edge advances the count or leaves it unchanged.

In VHDL, `std_logic` models control signals and `unsigned` from `ieee.numeric_std` gives bit vectors explicit arithmetic meaning. A clocked process remembers state only at `rising_edge(clk)`; a combinational process must assign every output path.
