A barcode scanner can finish reading a code while the label printer is still busy, leaving an accepted code waiting for somewhere to go. Put a one-word holder between them so that code stays available until the printer takes it, with room to accept the scanner's next code on the same edge that the old one leaves.

The scanner is the input side; the printer is the receiver. clk and synchronous active-high reset are one bit. The input side has in_valid, output in_ready, and eight-bit in_data. The output side has out_valid, input out_ready, and eight-bit out_data. Reset empties the holder; out_data is unspecified while out_valid=0.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Accept and preserve one word

The scanner has read a code, but the printer may still be working on the previous label. Store the accepted code and keep it available until the printer is ready to take it.

When empty, advertise that an input can be accepted. After accepting a word, present it with out_valid=1. While the receiver is not ready, retain both that word and its valid flag and reject further input transfers.

**Reason it through:** A scanned code of 00 is still a real pending code. What stored information distinguishes it from an empty holder, and what must remain stable while the printer waits?

**Check your reasoning:** Accept 42 while the receiver waits. Change the offered next input and confirm the pending output does not change.

## 2. Remove or replace a pending word

When the printer takes a code, the scanner may already have another one waiting. Let the old code leave and the new one take its place on the same edge, while preserving their order.

When a valid output is accepted, become empty if no new word arrives. If a new valid input is offered on that same edge, accept it as a replacement and remain full. The receiver gets the old word; the new one is visible afterward.

**Reason it through:** A full holder can accept a replacement only when the printer takes the old code. Why must the old word remain visible until that transfer edge, with the replacement appearing afterward?

**Check your reasoning:** Transfer 42 while accepting 73, then stall. Output must stay valid with 73; finally consume it without a replacement.
