### Start with a model

Before choosing gates, give the exhibit's indicator a place in your design. A **hardware model** is a text description of a circuit's connections and behavior. A simulator runs that description so you can check it before using real hardware. Nothing in this exercise programs a board or assigns a physical pin.

VHDL separates a block into two parts. An **entity** names the block and lists its **ports**, the signals that cross its boundary. An **architecture** describes what happens inside that entity. An input brings a signal in; an output carries a signal out. This first block only needs an output, because nobody controls its indicator yet.

### Read the two lines at the top

```vhdl
library ieee;
use ieee.std_logic_1164.all;
```

VHDL keeps reusable declarations in **packages**, stored in named **libraries**. The simulator already provides the packages used here; you do not have to download anything. IEEE stands for the Institute of Electrical and Electronics Engineers, the organization behind these standards.

`library ieee;` makes the library name `ieee` available in this source. `use ieee.std_logic_1164.all;` makes the declarations in its `std_logic_1164` package available by their short names. The dots separate the library, package, and selection; `all` selects all the package's declarations. That lets you write `std_logic` below. These lines make names available to the compiler; they do not add components or run hardware.

`std_logic` describes one logic signal. We will drive it with `'0'` for off or `'1'` for on. The type also has values for situations such as a signal that has not been initialized. You will meet those when they matter. No arithmetic package is needed for this first model.

### Name the block and its implementation

A new source file can contain the header above followed by an empty model:

```vhdl
entity beacon is
end entity;

architecture rtl of beacon is
begin
end architecture;
```

`beacon` is a name we chose. `entity ... is` starts its interface; `end entity;` closes it. `architecture rtl of beacon is` introduces an implementation named `rtl` for that entity. Here `rtl` is just a chosen name, not a command. Declarations belong before `begin`; behavior belongs between `begin` and `end architecture;`. The empty model is valid, but it has no connections or behavior yet.

### Add a port, then describe its behavior

For a separate example, suppose a beacon has a one-bit output that must stay **off**. Its complete source file is:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity beacon is
    port (
        lamp : out std_logic
    );
end entity;

architecture rtl of beacon is
begin
    lamp <= '0';
end architecture;
```

`port (...)` lists the connections. Read `lamp : out std_logic` as “a connection named lamp, directed out of the block, with type std_logic.” The colon separates the name from its declaration. Declaring a port does not decide its value. The entity ends at `end entity;`; the architecture below supplies the behavior.

`lamp <= '0';` is a **concurrent signal assignment**. The left side is the destination; the right side supplies its value. This connection remains active, rather than running once and returning a result. Single quotes surround a one-bit logic value. Semicolons end declarations and statements; indentation makes them easier to read. A comment starts with `--` and lasts to the end of its line.

### Connect your model to the tests

Your starter uses the entity name `top_module`. That is the name Nebula's tests look for, not a special VHDL keyword. Keep that name in both the entity and architecture. The editable file is `top_module.vhd`; `.vhd` identifies a VHDL source file.

**Run tests** compiles your source, creates an instance of the entity and architecture in a simulator, and runs a **testbench**: code that checks its signals. An instance is one copy of the described block. Here the testbench watches `output_signal`; in the next lesson it will also supply an input. You can read the supplied test file, but you do not need to write testbench code yet.

Run tests after each task and inspect **Results**. Adding the output can pass the first task before its value passes the second. An undriven `std_logic` output starts at `U`, meaning uninitialized. Once the model works, **Circuit** shows its logical connection and **Waveform** shows the recorded signal over time. Use **Submit** after all tests pass to complete the exercise.
