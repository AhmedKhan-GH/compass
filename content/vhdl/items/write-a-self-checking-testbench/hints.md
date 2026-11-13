## 1. Drive and check a timed case

Choose different input words and decide the expected output before running the case. Initialize the error count, wait for the output to settle, and compare the `std_logic_vector` values with VHDL's `/=` operator. A vector containing a meta-value such as `'X'` or `'U'` will not equal an expected vector made from `'0'` and `'1'`, so the mismatch is counted.

## 2. Distinguish both selector paths

Change the selected input as well as the switch position. Keep one error count across all cases, then use it for the single final verdict.
