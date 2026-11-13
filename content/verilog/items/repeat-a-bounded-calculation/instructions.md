A greenhouse gardener wants to see which of eight pots need water and how many are already wet. Each probe reports a 1 for a wet pot, so its reading needs to contribute differently to the dry-pot map and the wet-pot total. You are building both views of the current readings so the gardener can locate dry pots without confusing a previous set of measurements with the present one.

`samples` is an eight-bit input, `inverted` is an eight-bit output, and `ones` is a four-bit output. Use a bounded combinational loop to express repeated work.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Visit each bit

The gardener wants a lamp for each pot that needs water, but the probes report which pots are wet. Build the dry-pot map so each output position describes its matching probe.

Every bit of inverted must be the opposite of the matching samples bit. There is no clock or stored result.

**Reason it through:** Which loop limits include every probe position exactly once?

**Check your reasoning:** Set only the highest bit, then only the lowest. A missing endpoint should become obvious.

## 2. Count the active sensors

The map shows where the dry pots are, and the gardener also wants the number of wet pots. Add a total that is recalculated from the current readings each time they change.

ones reports how many samples bits are 1, from 0 through 8. It must describe the current word only, including after repeated input changes.

**Reason it through:** What should the count start at for each new reading? How many bits are needed to hold eight?

**Check your reasoning:** Try all ones followed immediately by all zeroes. The result must change from 8 to 0 rather than retain or accumulate the old count.
