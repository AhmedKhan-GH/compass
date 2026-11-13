Verilog simulation uses 0, 1, **x** (unknown), and **z** (undriven or high impedance). A missing driver can leave a wire at z. Conflicting drivers of equal strength can make a wire x. Adding a constant assignment does not replace the existing driver.

Ordinary equality `==` can itself become unknown if an operand is unknown. In a testbench, case equality `===` and case inequality `!==` explicitly compare all four states. Treating x as if it were zero can hide a broken circuit.

These diagnostic values help explain a waveform. The interface in this exercise expects definite outputs for definite input values.
