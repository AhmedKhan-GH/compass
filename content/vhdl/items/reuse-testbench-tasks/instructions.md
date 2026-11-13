Refurbished register boards arrive at a repair shop throughout the day. A technician repeats the same load and hold timing with several bytes, then proves reset clears a value that was actually stored. Complete one reusable VHDL checkout procedure so every board receives identical timing and the run produces one verdict.

The supplied `dut` is an eight-bit register with `clk`, synchronous active-high `reset`, and `load`; `d` and `q` are bytes. Reset clears on a rising edge, otherwise load captures `d`, and low load holds the byte. Keep the testbench entity, clock, component interface, and instance.

## 1. Package and check a load transaction

Declare a procedure inside the main process that accepts one byte. Drive it and assert load on a falling edge, wait through the rising capture edge and 1 ns, then compare `q`. Deassert load, change `d`, and cross another rising edge to verify hold behavior. Call it with `00`, `A5`, and `FF`, adding every mismatch to `errors`.

**Reason it through:** Which timing steps repeat, and which value belongs in the parameter?

## 2. Check reset and emit one verdict

After storing a nonzero value, assert reset on a falling edge and require `q = 00` after the next rising edge settles. A startup reset alone cannot expose a register that already contains zero. Finally print exactly one pass or fail marker, call `finish`, and retain the final `wait`. The checker must reject both reversed load-enable and ignored-reset DUTs.

**Check your reasoning:** Both faulty implementations must fail for behavior the checker explicitly observes.
