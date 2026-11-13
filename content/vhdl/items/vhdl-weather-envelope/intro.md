A record groups differently typed values under field names. Its declaration gives every field a type and, where useful, a legal range:

```vhdl
type room_report_t is record
    temperature : integer range -40 to 80;
    humidity : natural range 0 to 100;
    valid : std_logic;
end record;
```

A named aggregate constructs a complete value by field name, so the call site explains itself and does not depend on positional order:

```vhdl
report := (humidity => 73, valid => '1', temperature => -12);
```

Records do not define a wire layout by themselves. Explicit `pack` and `unpack` functions form the boundary between the record and a `std_logic_vector`. Packing an integer temperature uses `to_signed(value, width)` before conversion to `std_logic_vector`; packing a natural field uses `to_unsigned`. Unpacking reverses that route with `to_integer(signed(slice))` or `to_integer(unsigned(slice))`. Returning the declared record type makes every field assignment and range type-checked.
