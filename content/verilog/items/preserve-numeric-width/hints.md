## 1. Preserve the full sum

Make enough room before a calculation loses any bits. Adding a leading zero widens an unsigned value without changing its number.

## 2. Expose truncation and carry

Read the required positions from the full result. You cannot recover a carry from a result that already dropped it.
