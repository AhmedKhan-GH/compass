An **entity** names a hardware model and declares its ports; an **architecture** supplies its behavior. A one-bit output declaration such as `lamp : out std_logic` provides a connection, but does not give it a value.

`library ieee;` makes the IEEE library name available. `use ieee.std_logic_1164.all;` makes the package's declarations, including `std_logic`, available by their short names. These lines provide names and types, not hardware. `std_logic` can hold `'0'`, `'1'`, and values for conditions such as an uninitialized signal.

A concurrent assignment such as `lamp <= '0';` keeps a signal driven. The destination is on the left; the value is on the right. It remains active throughout the model's lifetime. Constants and simple connections do not require `numeric_std`; that package is introduced with arithmetic.
