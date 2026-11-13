The operators `~`, `&`, `|`, and `^` also work on vectors. Operators with two inputs work on matching bit positions. XOR `^` is 1 where the two bits differ. This lets a mask keep, clear, or toggle selected positions.

```verilog
assign combined = left_word ^ right_word;
```

A bitwise result keeps the word width. **Replication** builds a wider word by repeating a pattern: `{4{control}}` makes four copies of a one-bit control. This is wiring, not four operations performed over time.
