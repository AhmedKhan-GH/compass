An off-grid cabin uses twelve lamps that each draw the same amount of power, making the number lit a useful way to track its lighting budget. The occupants can choose how many lamps they allow at once and want a warning when they go over that number, whichever rooms are lit. Your job is to count the active lamps and raise the warning only when the chosen budget is exceeded.

## Required behavior

lamps is a twelve-bit input; limit is an unsigned four-bit input. count is a four-bit output reporting the number of 1 bits in lamps. One-bit over_limit is 1 only when count is strictly greater than limit. Equality is permitted. All limit values 0–15 are legal; a limit above 12 can never be exceeded.

The outputs are combinational. For lamps=100000000001, count is 2: limit 1 raises over_limit, while limits 2 and 3 do not.

## Before you code

How can you use the bit count to decide whether the limit is exceeded? Does a lamp’s position change its contribution to the power budget?

## Check your reasoning

Test no lamps, all twelve lamps, and equal counts at different positions. Change only limit to verify that the count stays fixed while the warning changes.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
