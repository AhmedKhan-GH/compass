# Alpine weather station: author intent

Task 1 exposes unsigned part-select extension. Task 2 combines a signed temperature with an unsigned correction whose top bit can be set. Task 3 requires a product beyond the original widths. The independent radio byte prevents accidentally using the complete packet as temperature. The exaggerated calibration range is explained in the public contract and exists to expose mixed-sign boundaries.

The reference uses $signed, zero extension of the unsigned operand, and a named wide signed intermediate. The introduction covers unsized literal semantics while the grader checks behavior, not preferred literal spelling. Every sample is tested against correction sign boundaries and a deterministic varied correction; task 3 likewise covers every sample and several scale-factor boundaries without an oversized waveform. Wrong implementations isolate unsigned slicing, reinterpretation of calibration, and a narrow intermediate product. Each cumulative stage completes exactly one additional task.

Cocotb checks binary representations rather than converting an unknown output to an integer, so unfinished or X-valued outputs produce clear failures. Waveforms capture the arithmetic transitions.
