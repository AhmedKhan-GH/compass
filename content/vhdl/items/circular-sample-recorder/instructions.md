A field station has room to keep five rainfall readings for an operator reviewing recent conditions. The operator asks for readings by age, with zero meaning the newest, so older entries must remain in the right order as new ones arrive and replace the oldest. Your job is to maintain that short history and its age-based lookup even after the same storage slots have been used several times.

## Required behavior

Preserve WIDTH=8, DEPTH=5, ADDR_WIDTH=3. clk, synchronous active-high reset, and sample_valid are one bit. sample_data and sample_out are bytes; age is three bits; count is four bits.

An edge with sample_valid=1 records the current sample. count is the number of retained samples and never exceeds five. age=0 selects the newest retained sample; age=1 the preceding one, and so on. An age greater than or equal to count returns zero. Changing age updates sample_out combinationally.

Idle edges preserve the window. Reset empties it with priority over a sample; invalid old words must not become visible. After recording 10,20,30, ages 0–3 return 30,20,10,0. After also recording 40,50,60, ages 0–4 return 60,50,40,30,20.

## Before you code

After the write position wraps, where is the newest reading and how do older ages find their slots? What must happen to count when a new sample replaces an old one?

## Check your reasoning

Record more than twice the depth, with idle gaps. Compare the returned age order with a short handwritten list of the five newest accepted values.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
