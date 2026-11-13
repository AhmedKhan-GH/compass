A weather-station board has returned to the repair bench with the capture file used during its original checkout. Each recorded input is followed by the output the board should produce, so the technician can replay the same evidence against a replacement register. Complete the VHDL testbench so it reads the entire file, applies every pair safely, and reports whether the replacement agrees.

The read-only `vectors.hex` contains six lines forming three hexadecimal pairs: `00`/`00`, `A5`/`A5`, and `FF`/`FF`. The supplied `dut` is a rising-edge, load-enabled byte register with synchronous active-high reset. Keep the portless `testbench`, file name, and DUT instance.

## 1. Read complete input/expected pairs

Replace the disabled loop with one that continues while the file has data. For each case, use `readline` and `hread` to read one stimulus byte, confirm another line remains, and read its expected byte. Increment `cases` once per complete pair. A file ending after a stimulus must trigger the supplied incomplete-pair failure.

**Reason it through:** When has one case become complete, and when is it safe to increment the count?

**Check your reasoning:** Six lines must produce three cases, with `FF`/`FF` last.

## 2. Replay and check every pair

Reset before replay. For each pair, wait for a falling edge before driving `d` and asserting `load`; then wait for the next rising edge and 1 ns before comparing `q` with `expected`. Add every mismatch to `errors` and report its case number, expected byte, and observed byte.

After end-of-file, report `CHECK_PASS` only when three cases were read with no mismatch; otherwise report `CHECK_FAIL replay`. End with `finish` and a final `wait`.

**Reason it through:** Why must the expected result come from the file rather than from `q`?

**Check your reasoning:** The correct DUT produces one pass marker; the faulty DUT produces one fail marker.
