An input is supplied from outside an entity; an output is driven by its architecture. Declare one-bit connections with `in std_logic` and `out std_logic`. Semicolons separate entries inside a VHDL port list, without a trailing separator after the last entry.

`panel_light <= door_open;` connects the output to the current input value. The output follows changes after the simulator updates the connection; this does not store a previous value. A testbench can supply the input and check the output before another hardware block uses the same interface.
