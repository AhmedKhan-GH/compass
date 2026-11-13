The finish-line camera's testbench reports the previous runner's bib number even though the camera register is capturing each new number correctly. The error comes from when the checker looks, and changing the next input at the wrong time can create a second timing problem. Repair both routines so observations follow completed captures and the driver presents each runner without racing the camera's sampling edge.

The supplied camera copies eight-bit `bib` into `captured_bib` on each rising edge of `clk`; synchronous active-high `reset` clears the register. The clock period is 10 ns.

Keep the entity, camera process, clock, procedure names, and argument directions unchanged. The checker process calls both procedures and prints one final verdict.

## 1. Inspect the frame after the camera has updated

The technician is checking a newly captured frame but sometimes reads the bib from the previous frame. Move the observation into the time after the camera register updates, then compare it with the expected runner.

Complete `inspect_frame(expected_bib, matched)`. Wait for the next rising edge, then return during this observation window: **strictly after that edge and before the next falling edge**. Set `matched` to 1 exactly when the captured bib is fully known and equals `expected_bib`; otherwise return 0.

**Reason it through:** Which bib can another process read in the same delta cycle as the camera signal assignment? How many delta cycles separate the clock event from the settled register output?

**Check your reasoning:** The fixture tries matching bibs, mismatches, and an unknown camera input. In Waveforms, identify the edge that captured a bib and the later instant at which your task returns.

## 2. Present the next runner between shutter edges

The testbench also needs to present the next runner before the camera samples again. Give the stimulus driver a separate time to change the bib, so it cannot race with the camera at a shutter edge.

Complete `present_bib(next_bib)`. Wait for the next falling edge, drive `bib` to the supplied number, and return at that edge. Leave the value stable until another call replaces it.

**Reason it through:** If the driver and the camera both awaken on a rising edge, which bib might the camera see? Choose a time at which that ambiguity disappears.

**Check your reasoning:** The fixture calls the driver at different times and checks the next camera capture. Use the trace to confirm that the input changes on falling edges and the recorded bib changes on rising edges.
