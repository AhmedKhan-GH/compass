# Expression width and sign

A Verilog expression has a bit width and is treated as signed or unsigned. These depend on the widths and types of its operands, along with where the expression appears. A wide output cannot recover bits already lost in a narrower intermediate result.

Part-selects and concatenations are unsigned. `$signed` and `$unsigned` change how Verilog interprets the bits without adding any bits. Before converting a nonnegative value to signed, add a leading zero so a high first bit cannot turn the number negative. When widening a negative value, repeat its sign bit to keep the same number.

Mixing signed and unsigned values can change how Verilog widens or compares them. Use named intermediate wires with suitable widths and types so each conversion is easy to check. Unsized decimal integers are signed and at least 32 bits wide. Sized literals state the width and sign directly.

Work out the smallest and largest possible results before coding. Test values below and above zero, and values where the highest bit changes. If an answer is wrong, look at both its binary pattern and its signed decimal value.
