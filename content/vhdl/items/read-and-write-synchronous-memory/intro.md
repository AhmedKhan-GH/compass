The roaster must save profile bytes and return the requested one at a clock edge. A writable memory is an array with rules for when writes happen and when a read result becomes visible. A **registered read** waits for an edge, unlike the immediate table lookup in the previous lesson.

Reading and writing the same address on one edge needs a clear rule. The read might return the old byte or the newly written byte; declaring an array alone does not choose between them.

The selector can also represent more addresses than the memory has slots. Check whether an address is inside the real memory before allowing it to select a word.

In VHDL, `std_logic` models control signals and `unsigned` from `ieee.numeric_std` gives bit vectors explicit arithmetic meaning. A clocked process remembers state only at `rising_edge(clk)`; a combinational process must assign every output path.
