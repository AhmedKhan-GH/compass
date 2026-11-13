During a rehearsal, the lighting operator checks three strips of footlights using a single brightness control. As the operator moves from one strip to the next, the previous strip needs to go dark so its light does not interfere with the next check. You will route the brightness setting to the selected strip and make the master off switch clear all three.

Each four-bit word is a brightness setting from `0000` (off) to `1111`. No fading or timing is required.

## Required behavior

The four-bit input `data` is the brightness setting. Outputs `lane_0`, `lane_1`, and `lane_2` each carry four bits to one strip. The two-bit input `destination` chooses a strip; one-bit `enabled` is the master control.

| enabled | destination | lane_0 | lane_1 | lane_2 |
| --- | --- | --- | --- | --- |
| 0 | Any | 0000 | 0000 | 0000 |
| 1 | 00 | data | 0000 | 0000 |
| 1 | 01 | 0000 | data | 0000 |
| 1 | 10 | 0000 | 0000 | data |
| 1 | 11 | 0000 | 0000 | 0000 |

Outputs follow current inputs. Moving the selection must clear the previous output. Setting `enabled=0` clears all three outputs.

## Before you code

For each strip, what combination of enable and destination lets it light? What should it show when a different strip is selected?

## Check your reasoning

Set brightness to `1010` for strip 1, move to strip 2, then use the master off switch. Predict all three brightness words at every step. Check that the old strip goes dark when the selection moves.

Keep the supplied module interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
