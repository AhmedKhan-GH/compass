An electronic organ lets the player recall presets: saved combinations of stops, the controls that select its sounds. Each preset has a byte describing its stop pattern, while a replacement controller stores a separate set of calibration bytes packed together in one long word. You are building the lookup logic so selecting a preset number retrieves the corresponding byte from both formats, despite their different storage arrangements.

address is a three-bit input. data and packed_byte are eight-bit outputs that change combinationally with address.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Read the addressed setting

The organist selects a preset number and expects the saved stop pattern to appear. Set up the preset table and make each address return its own byte without changing the stored patterns.

Populate the eight words with hexadecimal 10, 21, 32, 43, 54, 65, 76, 87 at addresses 0 through 7 respectively. data returns the word for the requested address.

**Reason it through:** Does the array index count bits or whole preset bytes?

**Check your reasoning:** Check addresses 0, 3, and 7, then revisit 0. Reads must not consume or change a stored setting.

## 2. Read a byte from a packed word

The replacement controller stores its calibration bytes together in one long word. Add the lookup for that format so the selected preset number finds the right byte at the right end of the word.

The packed value is hexadecimal 0123456789ABCDEF. Address 0 selects its least-significant byte EF; addresses 1 through 7 return CD, AB, 89, 67, 45, 23, 01.

**Reason it through:** How many bit positions separate neighbouring bytes? Which end of the packed word contains address 0?

**Check your reasoning:** Compare data and packed_byte for every address. Both select bytes, but their tables and addressing expressions differ.
