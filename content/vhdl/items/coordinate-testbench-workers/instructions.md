The repair bench needs to observe a queue while a sender and receiver work at different rates. The sender builds a three-byte burst while the receiver deliberately waits, reproducing traffic that exposed an ordering fault. Complete the independent VHDL processes so every byte is checked and a stalled simulation still ends usefully.

The supplied `dut` has `clk`, synchronous active-high `reset`, `push`, `pop`, and `empty`, plus byte-wide `din` and `dout`. The producer owns reset, data, and push; the consumer owns pop and checking; the watchdog observes `test_done`. Drive requests on falling edges so the DUT samples them on rising edges.

## 1. Run independent traffic workers

Keep producer, consumer, and watchdog as separate processes. The producer resets across two rising edges and sends `21`, `32`, and `43` hexadecimal through `send`, then asserts `producer_done`. Delay the consumer by four falling edges. For each expected byte, wait until the queue is nonempty, compare the front value, and pulse `pop`. The watchdog is bounded to 30 falling edges and reports only if `test_done` remains low.

**Reason it through:** Which process owns each request signal, and why would two drivers resolve rather than execute in order?

## 2. Coordinate checking and termination

Replace the placeholder loop with `expected'range` so all three bytes are checked. Accumulate mismatches in `errors`. After comparisons and `producer_done`, emit one verdict, assert `test_done`, and call `finish`.

Producer completion alone does not prove returned data was checked. The watchdog must remain silent after normal completion and never add a second verdict.

**Check your reasoning:** The correct DUT passes before the deadline; the faulty queue fails on the independent expected order.
