When refurbished boards reach the repair shop, a technician repeats the same register checks with several different bytes. The hand-copied versions have drifted apart, making it harder to tell whether a failure comes from the board or the timing of the test. Turn that checkout into a reusable routine whose calls apply the same timing and contribute to one clear result.

Write a reusable checkout for the supplied eight-bit register module dut. Inputs clk, synchronous active-high reset, and load are one bit; d and output q are eight bits. Reset clears q on a rising edge; otherwise load=1 captures d and load=0 holds q.

Use `` `timescale 1ns/1ps``, a 10 ns clock, falling-edge stimulus changes, and observations after the capture edge has settled.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Package one load transaction

Each refurbished board needs several test bytes, but the timing should stay the same from one check to the next. Package the repeated load operation so a technician can reuse it with a different byte.

Build a reusable task that accepts a byte, presents a load around a rising edge, and observes q afterward. Call it with different bytes after initialization and reset. The correct DUT must finish with CHECK_PASS from the checks completed so far.

**Reason it through:** The same checkout must load different bytes with identical timing. Which steps stay the same, and which value should become the task argument?

**Check your reasoning:** Compare two task calls on a waveform. Their timing should match even though their data differs.

## 2. Turn observations into a verdict

A printed value does not tell the repair shop whether a board passed. Extend the routine to compare its observations with expected values, including a reset that must clear a previously loaded byte.

Check the bytes 00, A5, and FF hexadecimal, then reset after a nonzero load and require q=00. Accumulate mismatches and finish with exactly one CHECK_PASS or CHECK_FAIL marker.

**Reason it through:** A board that powers up showing zero may still have a broken reset. What later test would require reset to change a stored nonzero value?

**Check your reasoning:** Run against all provided DUT variants. A useful checker accepts the correct register and rejects the faulty ones with messages showing the expected and observed values.
