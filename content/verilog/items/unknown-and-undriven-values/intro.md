The museum's simulation needs to distinguish a connection carrying zero from one carrying no driven value. Verilog uses four logic values: `0`, `1`, **x** for an unknown value, and **z** for an undriven or high-impedance value.

A wire with no driver can show `z`. If two definite drivers disagree, the wire can show `x`. Adding an assignment does not replace an old driver, so it does not fix a conflict by itself.

Ordinary equality, `==`, can return `x` when the compared values are uncertain. In a testbench, case equality `===` and case inequality `!==` compare all four states exactly. These comparisons help you notice uncertainty rather than treating it as zero.

Use Waveforms to inspect these values. This exercise checks that known input values produce the required known outputs; later exercises examine decisions with actual `x` and `z` inputs.
