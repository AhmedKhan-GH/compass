Entity generics declare typed compile-time configuration. `to_unsigned` converts the natural reset value to the selected width, and the same architecture works for each legal generic map. Elaboration creates the configured hardware before simulation begins. Named associations make each connection reviewable, while generic-controlled ranges ensure that every instance has ports of the width selected for that instance.

Generics are typed constants chosen when an instance is elaborated. Put each generic on its own declaration line and use it in port ranges:

```vhdl
entity pattern_gate is
    generic (
        WIDTH : positive := 8;
        CLEAR_VALUE : natural := 0
    );
    port (
        input_word : in std_logic_vector(WIDTH - 1 downto 0);
        output_word : out std_logic_vector(WIDTH - 1 downto 0)
    );
end entity;
```

An instance supplies alternatives with `generic map (WIDTH => 4, CLEAR_VALUE => 9)`. Convert a natural generic with `to_unsigned(CLEAR_VALUE, WIDTH)` before driving a vector.
