A grain-conveyor display looks correct for small sensor readings, but larger values disagree with its specified wrapping readout. Pauses between samples make the fault harder to inspect because the display keeps its last value while a separate flag says whether a new reading was accepted. Repair the calculation without disturbing that timing, so the displayed value and flag still describe the same sample.

## Required behavior

clk, synchronous active-high reset, and valid are one-bit inputs; sample is an unsigned byte. Outputs are one-bit out_valid and byte-wide scaled.

After a reset edge, both outputs are zero. After every other rising edge, out_valid reports whether valid was high before that edge. If a sample was valid, scaled becomes twice that accepted sample modulo 256; otherwise scaled holds its previous value. Neither output previews a new sample before the edge. Reset takes priority over a valid sample.

After reset, valid/sample pairs 1/7, 0/99, 1/200 produce out_valid/scaled pairs 1/14, 0/14, 1/144 after their respective edges. The final arithmetic intentionally wraps; it does not saturate.

## Before you code

Check when a sample is accepted, how its value changes, and when the result appears. Which observation distinguishes a width mistake from a one-cycle validity error?

## Check your reasoning

Create a small expected trace with back-to-back valid samples, an invalid gap, a high-bit sample, and reset during activity. Find the first disagreement in Waveforms, then inspect the corresponding data and control paths in Circuit.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
