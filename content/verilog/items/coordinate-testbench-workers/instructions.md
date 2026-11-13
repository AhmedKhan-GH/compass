The repair shop wants to see what a queue does when data keeps arriving while its receiver waits. You will give the testbench separate sending and receiving workers, delaying the reader so a small burst has time to build up. Coordinate them so every returned byte is checked and the test can still finish with a result if something gets stuck.

Write testbench.v for the supplied queue module dut. It has one-bit clk, synchronous active-high reset, push, pop, and empty; din and registered dout are bytes. A push stores one byte; an accepted pop updates dout at the rising edge. The planned traffic must avoid popping while empty or exceeding the supplied four-word capacity.

Reset across two rising edges, drive requests on falling edges, and observe a pop result after its sampling edge has settled.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Run independent traffic workers

The repair bench must send bytes while a separate worker reads them back later. Create both workers so the queue has something to hold, and give the test a deadline in case it gets stuck.

Use concurrent producer and delayed-consumer processes to send and receive 21,32,43 hexadecimal in order. The consumer starts four falling edges after the workers begin, allowing a short burst to accumulate. Add a watchdog bounded to 30 falling edges. The correct queue must complete without timeout.

**Reason it through:** The delayed reader lets a burst accumulate. Which worker owns each request signal, and how does the planned timeline keep every read legal without overflowing the four available places?

**Check your reasoning:** Annotate the first few pushes and pops on a timeline. Confirm the consumer reads only words already accepted.

## 2. Coordinate checking and termination

Sending the final byte does not prove that the queue returned it correctly. Finish the checkout only after the reader has checked every result, and make sure unfinished workers cannot report another verdict.

Compare every popped byte with the independently expected stream and record every mismatch. After the final comparison, print one CHECK_PASS for zero errors or CHECK_FAIL otherwise, stop the remaining workers, and finish. A watchdog timeout must print CHECK_FAIL and terminate through the same named group.

**Reason it through:** The producer finishing does not mean the last queued word was checked. Which worker can declare completion, and how will it stop a watchdog from printing a second verdict later?

**Check your reasoning:** Run against the correct and faulty queues. Check that each run produces exactly one consistent verdict and does not continue until the timeout after useful work ends.
