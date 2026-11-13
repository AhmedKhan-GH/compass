## 1. Carry the four bits 1010

Give `packed_status` enough bit positions for the whole pattern and use a sized constant. Task 2 replaces this test pattern with live inputs.

## 2. Join ready, fault, and mode into one word

Concatenation places fields side by side. The leftmost field goes into the highest bit positions.

## 3. Read the fault bit from the word

Use a bit select to read the position that carries the fault flag.

## 4. Read the two mode bits from the word

A part select includes both endpoints. Find those endpoints from the word layout.

## 5. Check whether mode is 10

Compare the whole mode field with the required code. Equality produces a one-bit answer.
