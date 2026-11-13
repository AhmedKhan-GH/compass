A ready/valid interface separates offering data from accepting it. A transfer happens at a rising edge when both valid and ready are high before that edge. Offering a word while ready is low is not a transfer.

A producer must keep a valid offered word stable while it waits. A one-word holder needs stored data and a separate flag saying whether that data is meaningful. It can accept while empty; it can also accept a replacement on an edge where the receiver takes the old word.

Reason about the old word leaving and the new word arriving as two events that may happen together. The receiver must get the old word before the new word becomes the pending output.

You will use this interface between a barcode scanner and a label printer.
