Visitors to an interactive exhibit can change a pattern of eight lamps while a second row echoes an earlier version, making a short visual trail. That echo needs to stay one captured sample behind the newest reading instead of following every change at the input. Your job is to build the delayed row so the trail advances with the clock and remains visible between updates.

## Required behavior

clk and active-high synchronous reset are one bit; sample and delayed are eight bits. On a reset edge, all stored history clears. Otherwise, after each rising edge delayed reports the sample from the preceding rising edge. It must hold between edges.

After reset, inputs 11, 22, and E0 hexadecimal at consecutive rising edges produce delayed values 00, 11, and 22. Changes between edges are not additional samples.

## Before you code

What information must survive from one edge to the next? Draw a timeline before deciding how many register stages are needed.

## Check your reasoning

Use different samples on consecutive edges and change the input between edges. Compare your drawn timeline with the saved waveform.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
