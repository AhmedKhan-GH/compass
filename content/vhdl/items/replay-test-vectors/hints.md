## 1. Read complete input/expected pairs

Use `while not endfile(vectors) loop`. After reading `stimulus`, the supplied assertion checks that an expected line remains. Call `readline` and `hread` again for that byte.

## 2. Replay and check every pair

Drive on `falling_edge(clk)`, sample after `rising_edge(clk)` plus `1 ns`, and update `errors` and `cases` with variable assignment `:=`.
