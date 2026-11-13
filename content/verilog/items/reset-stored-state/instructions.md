A theatre lighting desk stores dimmer levels for two channels whose clear controls serve different purposes. A routine cue should clear one channel with the next scheduled update, while the blackout control must clear the other without waiting for that update. You are modelling these two ways to reset a stored level so the desk responds at the time intended by each control.

`clk`, `sync_reset`, and `async_reset` are one-bit inputs. `data`, `sync_value`, and `async_value` are four-bit words. Both registers capture data on rising clock edges except when their reset rule applies.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Reset on a clock edge

A routine lighting cue should clear its dimmer only when the next update arrives. Build the first reset path so asking for a clear between clock edges does not change the level early.

sync_value captures data on a rising edge when sync_reset is 0. When sync_reset is 1 at that edge, sync_value becomes zero. Asserting sync_reset between edges must not change the stored output yet.

**Reason it through:** If the clock stops with synchronous reset high, when can this dimmer clear?

**Check your reasoning:** Capture 9, assert synchronous reset between edges, and inspect the output before and after the next rising edge.

## 2. Reset without waiting for the clock

The blackout control has a different job: its dimmer must clear without waiting for another clock edge. Add that reset path and keep the level at zero for as long as blackout stays active.

async_value becomes zero as soon as async_reset rises. While reset remains high it stays zero, including at clock edges. With reset low it captures data at rising edges. Deasserting reset by itself must not load data.

**Reason it through:** Which event must the procedure observe as well as the clock? Should releasing reset load a new level?

**Check your reasoning:** Capture C hexadecimal, then assert reset away from an edge. Compare the two reset styles in Waveforms.
