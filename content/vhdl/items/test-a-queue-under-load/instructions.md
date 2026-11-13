The repair shop has a short queue checkout, but it does not yet show what happens when a longer stream reuses the same storage addresses. Sending and receiving may overlap throughout that run, so the checker needs to follow every accepted byte through the queue. Extend it to cover that repeated use and confirm that reset discards a reading still waiting to be read.

## Required behavior

Write `testbench.vhd` for the supplied `dut` with one-bit `clk`, synchronous active-high `reset`, `push`, `pop`, and `empty`, plus byte-wide `din` and registered `dout`. A push stores a byte and an accepted pop reports the oldest byte after the rising edge. There is no full port, so your schedule must keep occupancy within 0–4 and avoid empty pops.

Reset across two rising edges before starting. Send at least six distinct bytes with a delayed consumer so both pointers wrap while workers overlap. Compare all popped bytes against your independent expected sequence. Then place a nonzero unread word in the queue, reset it, and require empty=1.

Drive at falling edges and observe registered pop results after updates settle. Use separate labeled VHDL processes for producer, consumer, and a finite watchdog. Coordinate normal completion with a signal so the watchdog stays silent after the consumer finishes. The correct DUT must finish successfully; faulty behavior must produce a diagnostic and `CHECK_FAIL`. Emit exactly one final `CHECK_PASS` or `CHECK_FAIL`, call `finish`, and leave each worker at a final `wait`.

## Before you code

Draw a schedule with occupancy after every edge. How will it force wrap and overlap without ever requiring the absent full signal? Which byte values would make repeated or out-of-order results easy to spot?

## Check your reasoning

For one schedule, send 21,32,43,54,65,76 hexadecimal while the consumer starts after four falling edges. Verify all six in order, then test reset with queued data. Explain what each part of your schedule reveals.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
