### Give the model something to respond to

The indicator in First Light had only an output. The lightbox needs a switch signal too. Its entity boundary now has two connections: an input supplied from outside and an output driven by the architecture. A port's direction is always described from the entity's point of view.

Here is a separate example of a door sensor connected to a panel:

```vhdl
library ieee;
use ieee.std_logic_1164.all;

entity door_panel is
    port (
        door_open : in std_logic;
        panel_light : out std_logic
    );
end entity;

architecture rtl of door_panel is
begin
    panel_light <= door_open;
end architecture;
```

The two header lines make the familiar `std_logic` type available. `door_open : in std_logic` declares an incoming one-bit signal; `panel_light : out std_logic` declares an outgoing one. Semicolons separate entries inside the port list, with none after the last entry. The separate semicolon after `)` closes the port declaration. This interface tells whoever uses the entity which signals to supply and which to observe.

### Follow a signal instead of a constant

The assignment's destination is still on the left, but its source is now a signal name instead of a fixed value. When `door_open` changes, `panel_light` follows after the simulator updates the connection. The model does not store an earlier value or wait for someone to call it again. The connection stays active.

Your starter carries forward the always-on output from First Light. Add the missing input before deciding how the lightbox should respond. Keep the required names `input_signal` and `output_signal` so the tests can connect to them. We use these names because `in` and `out` are VHDL direction keywords, not available signal names.

### Use the model from the outside

```text
testbench supplies input_signal --> [ top_module ] --> output_signal observed by testbench
```

The testbench stands in for a visitor changing the switch. It supplies `'0'`, then `'1'`, then more changes, lets the signals settle, and reads the output. Your architecture must read its input, not drive it. Later another hardware block could supply that same input; this exercise uses a simulator so you need no physical switch.

Predict the output sequence before running the tests. In **Waveform**, read time from left to right and compare the input and output at each change. In **Circuit**, look for the connection between the two ports. Neither view assigns them to real board pins.
