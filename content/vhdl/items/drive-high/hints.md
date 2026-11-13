## 1. Give the model an output

Add a `port (...)` declaration inside the entity. Follow the introduction's `lamp : out std_logic` example, using the required name. The last port has no trailing semicolon; `);` closes the list.

## 2. Light the indicator

The introduction's concurrent signal assignment keeps a different indicator off. Use that pattern with this output's name and the value that means lit. Put it between `begin` and `end architecture;`. One driver is enough.
