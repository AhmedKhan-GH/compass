A ready/valid interface separates offering data from accepting it. A transfer happens at a rising edge when both valid and ready are high before that edge. Offering a word while ready is low is not a transfer.

The sender must keep the offered word and its valid signal unchanged while it waits. A one-word holder needs stored data and a separate flag saying whether that data is meaningful. It can accept while empty; it can also accept a replacement on an edge where the receiver takes the old word.

Reason about the old word leaving and the new word arriving as two events that may happen together. Keep the words in their original order when both events happen on one edge.
