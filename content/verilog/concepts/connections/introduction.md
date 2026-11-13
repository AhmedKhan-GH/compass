### Give the model something to respond to

The indicator in First Light had only an output. The lightbox needs a switch signal too. Its module boundary now has two connections: an input supplied from outside and an output driven from inside. A port's direction is always described from the module's point of view.

Here is a separate example of a door sensor connected to a panel:

```verilog
module door_panel (
    input wire door_open,
    output wire panel_light
);
    assign panel_light = door_open;
endmodule
```

`input wire door_open` declares an incoming one-bit signal. `output wire panel_light` declares an outgoing one. Commas separate entries in a Verilog port list; there is no comma after the last entry. The interface tells whoever uses this module which signals to supply and which to observe.

### Follow a signal instead of a constant

The assignment's destination is still on the left, but its source is now a signal name instead of a fixed value. When `door_open` changes, `panel_light` follows after the simulator updates the connection. The model does not store an earlier value or wait for someone to call it again. The connection stays active.

Your starter carries forward the always-on output from First Light. Add the missing input before deciding how the lightbox should respond. Keep the required names `in` and `out` so the tests can connect to them; names in an exercise are an interface agreement, not special Verilog words.

### Use the model from the outside

```text
testbench supplies in --> [ top_module ] --> out observed by testbench
```

The testbench stands in for a visitor changing the switch. It supplies `0`, then `1`, then more changes, lets the signals settle, and reads the output. Your module must read its input, not drive it. Later another hardware module could supply that same input; this exercise uses a simulator so you need no physical switch.

Predict the output sequence before running the tests. In **Waveform**, read time from left to right and compare the input and output at each change. In **Circuit**, look for the connection between the two ports. Neither view assigns them to real board pins.
