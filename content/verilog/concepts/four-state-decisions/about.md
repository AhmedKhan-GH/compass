# Four-state decisions

Verilog simulation uses 0, 1, unknown `x`, and high-impedance `z`. These values tell you what the simulator knows about a signal. An `x` is not an extra voltage that a real gate can detect.

A one-bit `if` condition takes its true branch for 1 and its other branch for 0, `x`, or `z`. The result can look definite even when the condition is unknown. The `?:` operator handles an unknown one-bit selector differently: it compares the two possible results bit by bit, keeping matching bits and using `x` where they disagree.

Ordinary equality (`==`) can return `x`. Case equality (`===`) and case inequality (`!==`) compare all four states exactly and always return 0 or 1. Use them when a simulation check needs a definite answer about values containing `x` or `z`.

Check known inputs and unknown inputs separately. Use a four-state simulator to drive real `x` and `z` values and inspect their waveforms. Toggling 0 and 1 in a synthesized circuit viewer does not test these cases.
