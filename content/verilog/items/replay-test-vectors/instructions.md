A weather-station board has come back to the repair shop with a short log of the checks used to inspect it. Each recorded input has an expected result, giving the technician a way to repeat the same checks on a replacement board. Put that record to work in a testbench that reads every pair, applies it, and reports any disagreement.

The read-only file `vectors.hex` contains three input/expected pairs: 00/00, A5/A5, FF/FF hexadecimal. The supplied dut is the same rising-edge load-enable register: one-bit clk, synchronous active-high reset, and load; eight-bit d and q. Keep the supplied filename and module interface.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Load and interpret the file

The returned board comes with a log of inputs and expected results. First make that log readable to the checker, so the technician can confirm that every recorded pair has been found.

Load the six bytes into an array, identify all three pairs, and print each input beside its expected output. Finish the simulation so the runner can inspect the complete replay setup.

**Reason it through:** Each logged case occupies an input byte followed by an expected byte. Which array indices identify those roles, and where does the final pair begin?

**Check your reasoning:** Compare your printed pairs with the file, especially the last pair. No pair should be skipped or treated as two independent cases.

## 2. Replay the complete log

The technician can now read the log, but still needs to know whether the replacement board reproduces it. Replay every pair through the register and report where the observed result differs from the record.

Reset the DUT, then apply and check every pair through its load interface. Change inputs away from rising edges and compare after registered outputs settle. Report pair index, expected byte, and observed byte on mismatch. Finish with one CHECK_PASS for zero mismatches or CHECK_FAIL otherwise.

**Reason it through:** The capture log is your independent record of what should happen. Why would deriving the expected byte from q, or stopping after the first match, weaken the replay?

**Check your reasoning:** The correct DUT must pass all pairs; the faulty DUT must fail. Keep the messages from every mismatch; do not replace earlier failures with the last result.
