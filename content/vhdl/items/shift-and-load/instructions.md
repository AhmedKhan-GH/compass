A cinema sign has a row of eight lamps that the operator can fill with a complete pattern or scroll as new lamp values arrive. The row needs to keep its current picture between these changes, and a request for a fresh pattern should take priority over scrolling it at the same moment. You are building the stored lamp row and the controls that let the operator use it both ways.

The stored row is the eight-bit output pattern. `parallel_in` is an eight-bit input; clk, synchronous active-high reset, load, shift, and serial_in are one bit. All stored changes happen at rising edges.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Load and preserve a pattern

The cinema operator first needs to put a complete pattern on the marquee and leave it there. Add the whole-row load so preparing the next pattern does not disturb the one currently displayed.

Reset clears pattern. Otherwise, when load=1, capture parallel_in. With load=0 and shift=0, keep the old pattern.

**Reason it through:** Why should preparing a new input pattern leave the stored row unchanged while load and shift are low?

**Check your reasoning:** Load 95 hexadecimal, then change parallel_in during an idle cycle. The stored lamps must remain 95.

## 2. Move the stored bits

The row can now hold a picture; next it needs to scroll as new lamp bits arrive. Add that movement and decide what happens when the operator requests a fresh row at the same time.

When load=0 and shift=1, move each old bit toward the higher numbered position, discard old bit 7, and put serial_in in bit 0. Priority is reset, then load, then shift, then hold.

**Reason it through:** If load and shift are both high, which action wins? Which pattern will a later shift move?

**Check your reasoning:** Load 81 hexadecimal with both controls high, then shift with serial_in=1. The two results are 81 then 03.
