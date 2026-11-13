A queue separates physical addresses from the number of stored words. Write and read pointers identify the next locations to use; occupancy is the number of stored entries. Equal pointers alone do not distinguish an empty circular queue from a full one.

Requests are not automatically accepted. This queue decides from the number of entries stored before the edge: a push while full is rejected and a pop while empty is rejected, even if the opposite request occurs on the same edge. This policy differs from the one-word holder’s same-edge replacement at full capacity.

If the depth is not a power of two, the pointer must wrap after the last valid address. A three-bit pointer can encode 0–7, but a five-entry queue owns only 0–4.

You will track waiting jobs in the photo booth's print queue.

In VHDL, `std_logic` models control signals and `unsigned` from `ieee.numeric_std` gives bit vectors explicit arithmetic meaning. A clocked process remembers state only at `rising_edge(clk)`; a combinational process must assign every output path.
