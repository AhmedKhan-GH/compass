## 1. Package one load transaction

Change `load` and `d` on a falling edge. Let the next rising edge capture the value, then observe after the following falling edge. Declare the task outside the `initial` block.

## 2. Turn observations into a verdict

Use case inequality in the reusable comparison. Load a nonzero value before testing reset so that clearing has an observable effect.
