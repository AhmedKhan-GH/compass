## 1. Drive and check a timed case

Choose different input words and decide the expected output before running the case. Initialize the error count, wait for the output to settle, and use `!==` so an unknown output fails the comparison.

## 2. Distinguish both selector paths

Change the selected input as well as the switch position. Keep one error count across all cases, then use it for the single final verdict.
