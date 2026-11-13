A repair shop is checking replacement registers that capture a reading on a clock edge and hold it for the rest of the board to use. A replacement might eventually show the right byte yet update at the wrong time, making a check of the final value misleading. Your job is to write the inspection testbench that checks both the reading and when it becomes available.

`sample_register` has one-bit clk and synchronous active-high reset, eight-bit data, and eight-bit q. Reset clears q at a rising edge; otherwise q captures data at that edge and holds between edges. The runner tests your checker against correct and faulty register implementations.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Establish a timed baseline

The repair bench first needs to show that a working register clears and captures a reading. Set up the clock and checks so the bench judges each output after the register has had time to update.

Generate a clock, apply reset across a rising edge, and check that q clears. Capture a nonzero data word and check the result after its sampling edge. The correct DUT must produce one CHECK_PASS verdict based on your comparisons.

**Reason it through:** Could a check at the instant of the edge still read the old register value?

**Check your reasoning:** Print the observation time and expected/actual q for a failing check. Match that point to the waveform.

## 2. Prove capture happens at the right time

A replacement part might produce the right byte at the wrong time. Extend the inspection to catch early updates and updates on the wrong edge, and make sure a stalled inspection can finish with a failure.

Extend the checker to reject a register that updates on falling edges and a circuit that follows data continuously. Include an independent bounded watchdog and finish with one verdict derived from all comparisons.

**Reason it through:** When would a falling-edge register or a continuously changing output disagree with the required register?

**Check your reasoning:** Change data between edges and around a falling edge. q must hold until the next rising edge, then capture the newest value.
