## 1. Package and check a load transaction

Declare `check_load` after `errors` and before the process `begin`. It can update `errors` directly. Use falling-edge drives and compare 1 ns after rising edges.

## 2. Check reset and emit one verdict

The last call leaves `FF` stored. Assert reset before the next rising edge and compare with `x"00"`. Keep verdict strings only in the final `if errors = 0` decision.
