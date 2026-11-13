The operators `~`, `&`, `|`, and `^` also work on vectors, applying their rule at each bit position. XOR `^` gives `1` where its two input bits differ. A **mask** is a word whose bits select positions to keep, clear, or flip.

```verilog
assign combined = left_word ^ right_word;
```

A bitwise operation produces a word of results. **Replication** repeats a pattern: `{4{control}}` makes a four-bit word from four copies of the one-bit `control`. All four copies are present at the same time.
