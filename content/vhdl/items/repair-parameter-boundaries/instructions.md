A compact trail monitor records whether a gate is open, using just one bit per reading and three storage slots. Its recorder was adapted from a larger version and appears to work for the first few samples, but it eventually tries to write beyond the available storage. You are investigating that failure so the small recorder can keep accepting readings without losing its place in the log.

## Required behavior

Use WIDTH=1, DEPTH=3, ADDR_WIDTH=2. Keep the supplied interface and the internal addr and mem names, which the checker observes. clk, synchronous active-high reset, en, data_in, and data_out are one bit in this configuration.

Each enabled rising edge records data_in at the current address, updates data_out to that bit, and advances to the next legal address. The write sequence is 0,1,2,0,1… . Disabled edges preserve the address and output. Reset sets address and output to zero and takes priority over en; old stored bits need not be erased.

From reset, four enabled inputs 0,1,1,0 produce outputs 0,1,1,0 and leave addr at 1.

## Before you code

Which addresses fit in the input bits but fall outside the actual memory? Why must the one-bit data width remain legal while you repair the address wrap?

## Check your reasoning

Write through more than one complete wrap, inserting disabled edges. Trace the internal address alongside the accepted input count.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
