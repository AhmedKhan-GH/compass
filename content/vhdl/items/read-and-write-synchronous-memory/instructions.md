A coffee roaster recalls saved settings called profiles so an operator can return to a chosen setup. In this small controller model, each of five profiles occupies one byte, although the selector has eight positions. You are building storage that lets the operator save and read those settings, confirms a new value when it is read during a save, and handles the unused positions without disturbing real profiles.

Preserve WIDTH=8, DEPTH=5, and ADDR_WIDTH=3. clk, synchronous active-high reset, and write_en are one bit; write_addr and read_addr are ADDR_WIDTH bits; write_data and registered read_data are WIDTH bits.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Store words and register reads

The roaster needs to save a profile and read it back on a later clock edge. Build the basic storage and readback first, using real profile positions and separate read and write addresses.

On a non-reset rising edge, write_en=1 stores write_data at a legal write_addr. Other words hold. At every rising edge, read_data updates for the sampled read_addr. Changing read_addr between edges must not change read_data. Reset clears the words and read output. For this task, use addresses inside the memory and keep the read and write addresses different.

**Reason it through:** Which requests are sampled at the edge, and which results become visible afterward?

**Check your reasoning:** Write A5 to address 3 while reading 0, then request address 3 on the next edge. read_data must then show A5.

## 2. Resolve collisions and invalid addresses

The operator may save the profile currently being read, or turn the selector to an unused position. Complete those cases so readback confirms a valid save and an invalid address cannot change another profile.

Use the write-first rule: reading and writing the same valid address on one edge returns the newly written word. Addresses 5–7 cannot write and return zero when read. Reset takes priority over every request and clears all five words plus read_data.

**Reason it through:** Why is address 7 invalid despite fitting in three bits? Which byte should a same-address write and read return?

**Check your reasoning:** Write 3C to address 3 while reading 3; expect 3C immediately after the edge. Then attempt an invalid write and confirm legal words are unchanged.
