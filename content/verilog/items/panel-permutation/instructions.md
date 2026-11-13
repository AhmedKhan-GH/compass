A museum is replacing a worn exhibit-light panel, but the new panel's connector puts the lamps in a different order. Connecting it directly would make the old controller light the wrong positions, changing the patterns visitors see. You will design the adapter wiring that connects each controller signal to its intended lamp, so the replacement panel can keep showing the familiar display.

## Required behavior

`status[7:0]` is the input and `lamps[7:0]` the output. Each output bit continuously follows the input bit in this table:

| Output | Input |
| --- | --- |
| `lamps[7]` | `status[3]` |
| `lamps[6]` | `status[2]` |
| `lamps[5]` | `status[1]` |
| `lamps[4]` | `status[0]` |
| `lamps[3]` | `status[5]` |
| `lamps[2]` | `status[4]` |
| `lamps[1]` | `status[6]` |
| `lamps[0]` | `status[7]` |

All 256 input words are valid. There is no clock or stored state. Input `00000001` produces `00010000`; input `10110001` produces `00011101`.

## Before you code

Which neighboring input bits stay together? Which individual bits move elsewhere? Sketch all eight connections before writing the Verilog.

## Check your reasoning

Set just one input bit at a time. Exactly one corresponding lamp should light. The circuit view should look like reordered wires.

Keep the supplied module interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
