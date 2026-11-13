A garden controller rotates through six watering zones, while its maintenance display has eight positions that a technician needs to test. The two sequences can share a clock and pause control, but they need to return to their starting points at different counts. Your job is to build both repeating sequences so each visits its intended positions and keeps its place whenever the controller is paused.

The two independent position counters, natural_count and six_count, are each three bits wide. They share one-bit clk, synchronous active-high reset, and enable. Reset clears both; disabled edges hold both.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Count through every three-bit position

The maintenance display needs to visit every position its three-bit value can represent. Build that repeating count first, so a technician can step through the full range and pause without losing a position.

On each enabled rising edge, natural_count advances once through 0,1,2,3,4,5,6,7,0 and repeats.

**Reason it through:** What must the circuit remember so it advances once per enabled edge rather than continuously?

**Check your reasoning:** Count at least nine enabled edges after reset. Compare the first wrap with the binary representation.

## 2. Fit a six-position display

The watering sequence must return to the first zone after the last real one, without visiting the extra display positions. Add its shorter cycle while keeping the full maintenance count working beside it.

six_count advances through 0,1,2,3,4,5,0 and repeats. It must never visit 6 or 7 during normal operation. Keep natural_count working.

**Reason it through:** Why do two counters with the same width need different wrap rules?

**Check your reasoning:** Run both for several edges, pause with enable=0, then resume. A pause must not consume a position.
