In a photographic darkroom, an enlarger shines light through a negative onto light-sensitive paper to make a print. The time its lamp stays on affects the result, so an exposure needs to keep the duration the photographer chose at the start, even if the dial moves or the start button is pressed again. Your job is to control that exposure, including leaving the lamp off when the chosen duration is zero.

## Required behavior

clk, synchronous active-high reset, start_pulse, and lamp are one bit; duration is four bits. Accept a start only when idle. Capture its duration at that rising edge. A nonzero duration turns the lamp on immediately after that edge for exactly that many complete clock intervals. Duration zero produces no pulse.

Starts while busy are ignored, including a start on the edge that ends the old pulse. Changes to duration while busy do not alter the accepted request. Reset cancels the pulse and clears state.

An accepted duration of 3 makes lamp high after the start edge and low after the third edge after the start.

## Before you code

Which values must be kept from the moment a start is accepted? At what edge should an interval of length 1 end?

## Check your reasoning

Test durations 0, 1, and 3, then change duration and request another start during a pulse. Check both length and restart policy in Waveforms.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
