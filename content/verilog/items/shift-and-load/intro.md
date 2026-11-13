The marquee needs to keep a row of lights and sometimes move that row. A **shift register** stores a word and moves its bits on selected clock edges. A combinational shift only transforms the current input; it does not remember an earlier word.

A register can have several actions: clear, load a complete word, shift the stored word, or hold it. Decide which action wins if two controls are high together.

Also define the bit order before coding: which end loses a bit, which way the others move, and where the new bit enters. These choices determine the visible scroll direction.
