A referee using a gym scoreboard should be able to hold the scoring button without awarding points repeatedly. The scoring logic needs a single notification when a press begins, followed by a release before another press can count. Working with a button signal that has already been made stable and aligned to the clock, you will build the circuit that distinguishes a new press from one still being held.

## Required behavior

clk, synchronous active-high reset, button, and rise are one bit. After each rising clock edge, rise is 1 only if the newly sampled button is 1 and the preceding sampled value was 0. Otherwise rise is 0. Reset clears the remembered button state and rise.

Sampled button values 0,1,1,1,0,1 produce rise values 0,1,0,0,0,1. A press held high does not produce repeated notifications. Treat button as an already clock-aligned input; this exercise does not implement switch debouncing or synchronization.

## Before you code

Can the current button value alone distinguish a new press from a held press? What is the minimum history you need?

## Check your reasoning

Compare a one-edge press, a long press, and release followed by another press. Changes between sampling edges do not automatically create extra events.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
