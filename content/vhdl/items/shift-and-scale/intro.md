`shift_left(unsigned(...), 1)` doubles modulo the output width, while `shift_right(signed(...), 1)` preserves the sign. Save the discarded high bit separately. The declarations still use resolved logic vectors at the entity boundary. `numeric_std` conversions give those bits a numeric interpretation only for the expression where they appear, which keeps signedness and result width deliberate.

Choose `unsigned` or `signed` before shifting because right-shift behavior depends on the numeric interpretation:

```vhdl
twice <= std_logic_vector(shift_left(unsigned(magnitude), 1));
half_signed <= std_logic_vector(shift_right(signed(offset), 1));
```

A left shift inserts zero at the low end and may discard the old high bit. A right shift of `signed` copies the sign bit, preserving negative two's-complement values.
