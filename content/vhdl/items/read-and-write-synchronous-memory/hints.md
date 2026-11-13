## 1. Store words and register reads

Use an array to store the profile bytes and a register for the read result. Reads still happen on clock edges when writing is disabled.

## 2. Resolve collisions and invalid addresses

Handle a read and write to the same legal address separately from an ordinary read. Check address bounds on both sides, and let reset clear the memory and read output first.
