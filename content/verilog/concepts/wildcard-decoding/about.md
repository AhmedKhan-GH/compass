# Wildcard decoding

A wildcard decoder recognizes a group of codes while ignoring chosen bits. In `casez`, `z` and `?` are wildcards in both the listed patterns and the input being checked. An `x` in a position that must match is not ignored. `casex` also treats `x` as a wildcard, which can hide an input that was never driven or initialized.

A `?` in a listed pattern ignores the matching input position, even if that bit is `x`. An `x` in a required position is different: `casez` cannot ignore it. An input `z`, however, can act as a wildcard even in a required position. If several patterns match, the first listed match wins.

Ask two separate questions: which pattern matches, and are all the input bits known? Reduction XOR and a case comparison can check for `x` or `z` in simulation. Real receivers need their own signals and rules for reporting valid data or errors; they cannot detect a simulator's `x` value.

Test the required bits, the ignored bits, and inputs that match more than one pattern. Try `x` and `z` in each relevant position. Use the waveform to see how an incomplete input can still produce a convincing-looking result.
