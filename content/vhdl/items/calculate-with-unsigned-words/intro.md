Until now, the parts display only needed connections and decisions about bits. Totalling two bins needs arithmetic, so this source file introduces another package from the IEEE library: `numeric_std`. It provides numeric types such as `unsigned`, together with arithmetic operators and conversions. The familiar `std_logic_1164` package still provides the port types.

Add its `use` line beside the existing one, before the entity. Just as in First Light, `all` makes the package's declarations available by their short names; it does not add hardware by itself:

```vhdl
library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
```

`std_logic_vector` describes a group of logic signals. To calculate with those bits as a nonnegative binary number, use `unsigned(...)`. Convert an arithmetic result back with `std_logic_vector(...)` when the destination is a logic-vector port. For a separate pair of readings:

```vhdl
total <= std_logic_vector(unsigned(first) + unsigned(second));
smaller <= '1' when unsigned(first) < unsigned(second) else '0';
```

With two eight-bit unsigned operands, addition produces an eight-bit result. A value beyond 255 wraps around because the carry does not fit. Merely choosing a wider destination does not widen the addition: retaining the carry requires widening the operands before adding, which a later lesson explores. Equality can compare a pair of logic vectors directly; use an explicit numeric type for ordering them as numbers.
