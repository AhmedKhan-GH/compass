A farmhouse sends a gauge reading to a display in the barn over a single data line with a shared clock. Since the reading travels one bit at a time, a new measurement arriving halfway through must not mix with the one already being sent. Your job is to build a sender that preserves each accepted byte and delivers all eight of its bits in the required order.

## Required behavior

clk, synchronous active-high reset, load, bit_out, and busy are one bit; word is eight bits. Accept load only while idle. After the accepted load edge, busy is high and bit_out shows captured bit 7. Each following rising edge advances to the next lower bit.

The eight bits occupy eight complete clock intervals. After the next edge, busy and bit_out are zero. Changing word or asserting load while busy must not alter the transfer. A load on the final busy edge is ignored. Reset cancels any transfer and clears state.

For 10110010, the eight output intervals are 1,0,1,1,0,0,1,0.

## Before you code

What must you store to track the remaining data and know when all eight bits have been sent? Why does the load edge count as the first output interval?

## Check your reasoning

Test a word with different first and last bits, then disturb word during a transfer. Check bit order, exact length, and idle output.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
