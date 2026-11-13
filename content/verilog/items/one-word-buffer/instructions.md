A shop manager sends a price update to an electronic sign, then notices that the price is wrong while the display is still busy. The pending update must be cancelled before it reaches the display, without accidentally keeping another value offered during that cancellation. Add a flush control to the one-word buffer, while preserving its normal transfer behavior for the next update.

## Required behavior

clk, synchronous active-high reset, and flush are one bit. The ready/valid input side is in_valid, in_ready, and eight-bit in_data; the output side is out_valid, out_ready, and eight-bit out_data.

During ordinary operation, accept when empty or when the receiver takes the pending word on that edge. A full stalled buffer must preserve its valid byte and refuse another input. A simultaneous output transfer and input acceptance replaces the old byte without an empty cycle. Empty output data is unspecified.

When flush is high, advertise neither input readiness nor output validity, so no transfers occur. At the rising edge, discard the pending word. After flush is lowered, the buffer stays empty until a new word is accepted. Synchronous reset also empties it and has priority. Flush does not preserve an input offered on its clearing edge.

## Before you code

How does adding flush change the permission to transfer as well as whether the buffer is full? List the outcomes when flush overlaps a stalled word, a new input, or an otherwise possible replacement.

## Check your reasoning

Accept 9, stall it, then flush while 10 is offered. After lowering flush, neither 9 nor 10 may appear as an accepted old word. Then accept a fresh 11 and prove the normal replacement behavior still works.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
