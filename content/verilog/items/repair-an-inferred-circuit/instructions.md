At the end of a lecture, the display selector is disabled, but its simulation keeps showing the word that was selected last. That remembered value points to a difference between the intended circuit and the hardware described by the source. Follow the failure through the waveform and generated circuit, then repair the selector so disabling it clears the output without adding a clock.

## Required behavior

Inputs enable and select are one bit, a and b are eight-bit words, and y is an eight-bit output. With enable=0, y is zero. With enable=1, select=0 chooses a and select=1 chooses b. Every input change must produce the corresponding settled output without a clock or memory.

Find the mismatch, explain which hardware was generated, and repair the behavior without adding a clock or reset.

## Before you code

Which transition distinguishes a true combinational selector from one that remembers a previously selected word? What circuit element would preserve that word?

## Check your reasoning

Build the starter’s circuit, then select a nonzero input and disable it. Save that observation, repair the source, and rebuild. Explain what changed in the circuit as well as why the tests now pass.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
