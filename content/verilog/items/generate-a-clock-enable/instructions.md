A model station's departure board refreshes once every four clock ticks, and a technician uses a maintenance count to check that the refresh sequence keeps advancing. The count is useful only if it agrees with the refresh pulse about which update has just occurred. You are building the timing circuit that issues each scheduled pulse and records it on the same edge.

The board updates once every four rising edges. Inputs are clk and synchronous active-high reset. One-bit update is a registered pulse; four-bit updates counts the completed panel updates. Reset clears the phase, pulse, and count.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Mark every fourth edge

The departure board needs one refresh permission for every four clock ticks. Build the repeating pulse so the board gets each scheduled update once, with no extra pulse between them.

After reset, update is 0 after edges 1, 2, and 3, 1 after edge 4, and then repeats that four-edge pattern. Each pulse lasts one clock interval.

**Reason it through:** Which count value before the edge marks the fourth tick?

**Check your reasoning:** Label twelve edges in Waveforms. Pulses should appear after edges 4, 8, and 12.

## 2. Count completed updates

The technician wants a count of the refreshes that have actually occurred. Add the maintenance count so it changes with each refresh pulse, rather than reporting that update one clock later.

updates increases on the same edges that produce update=1. It holds on other edges and wraps naturally after 15.

**Reason it through:** If an assignment reads `update` on the edge that raises it, does it see the old pulse or the new one?

**Check your reasoning:** After edges 3, 4, 7, and 8, updates should be 0, 1, 1, and 2 respectively.
