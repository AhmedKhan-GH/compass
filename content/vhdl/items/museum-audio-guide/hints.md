## 1. Recognize the exhibit

Declare `decoded_stop` as `std_logic_vector(3 downto 0)` and associate it with `stop_id => decoded_stop`.

## 2. Restore the volume range

The intermediate volume signal needs the same range as both ports. A scalar `std_logic` cannot preserve a nibble.

## 3. Let the visitor start the guide

Use one concurrent `and` expression. Multiple concurrent assignments create multiple drivers rather than replacing an earlier assignment.
