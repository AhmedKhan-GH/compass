## 1. Invert the word

Vector NOT applies the one-bit NOT rule to every position.

## 2. Select the visible positions

For one position, decide which output is needed for each status/mask pair. Bitwise AND applies that rule across the word.

## 3. Toggle the whole display

XOR with `0` keeps a bit and XOR with `1` flips it. Replication copies the same control bit into every position.
