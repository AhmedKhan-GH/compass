The `signed` view gives two's-complement ordering, and `resize` sign-extends it to twelve bits. The original most-significant bit directly reports negativity. The declarations still use resolved logic vectors at the entity boundary. `numeric_std` conversions give those bits a numeric interpretation only for the expression where they appear, which keeps signedness and result width deliberate.

`signed` tells `numeric_std` to interpret the high bit as a two's-complement sign. `resize` repeats that sign bit when widening:

```vhdl
wide_value <= std_logic_vector(resize(signed(raw_value), 12));
is_cold <= '1' when signed(raw_value) < signed(reference) else '0';
```

The port may remain a `std_logic_vector`; the conversion is local to the expression. Both sides of an ordered comparison should use the same signed interpretation.
