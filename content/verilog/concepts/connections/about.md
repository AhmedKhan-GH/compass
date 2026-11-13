An input is supplied from outside a module; an output is driven from inside. Declare one-bit connections with `input wire` and `output wire`. Commas separate ports in a Verilog module header.

`assign panel_light = door_open;` connects the output to the current input value. The output follows changes after the simulator updates the connection; this does not store a previous value. A testbench can supply the input and check the output before another hardware module uses the same interface.
