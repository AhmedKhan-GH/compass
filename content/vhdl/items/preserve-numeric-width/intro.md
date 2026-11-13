Use `resize(unsigned(...), 9)` before addition so the carry is computed rather than discarded; then expose the low slice and high carry bit. The declarations still use resolved logic vectors at the entity boundary. `numeric_std` conversions give those bits a numeric interpretation only for the expression where they appear, which keeps signedness and result width deliberate.

Resize both operands before adding when the carry must survive. This example widens four-bit inputs to five bits:

```vhdl
signal wide_total : std_logic_vector(4 downto 0);

wide_total <= std_logic_vector(
    resize(unsigned(left_word), 5) + resize(unsigned(right_word), 5)
);
```

Adding first and resizing afterward is too late because the narrow addition may already have discarded its carry. A slice such as `wide_total(3 downto 0)` recovers the wrapped portion.
