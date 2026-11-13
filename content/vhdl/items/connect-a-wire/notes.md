# Exhibit Switch: extend the same boundary

Carry forward the always-on output from First Light. Introduce input direction from the model's point of view, two-port list punctuation, and who drives each side of the interface. A complete door-panel example teaches syntax without prescribing the lightbox implementation. Explain how a testbench supplies a sequence and observes the model; defer testbench authorship, clocks and gates.

Task 1 adds the named one-bit input while preserving the output. Task 2 replaces the fixed output behavior with a connection that follows the input. The first stage passes the interface check and fails behavior; the second passes both. Missing ports and wrong widths yield helpful assertion failures. The interface check observes names and widths, not port directions. The repeated low/high sequence rejects constants and retained values.

Keep the original identity and final behavior. Later Workshop Controls can then introduce transformations of familiar signals instead of introducing the module boundary and Boolean logic at once.
