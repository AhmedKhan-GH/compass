A queue tracks both where words are stored and how many it holds. Write and read pointers identify the next locations to use. The number of stored entries is called occupancy. Equal pointers alone do not distinguish an empty circular queue from a full one.

Requests are not automatically accepted. This queue decides from the number of entries before the clock edge: a push while full is rejected and a pop while empty is rejected, even if the opposite request occurs on the same edge. This policy differs from the one-word holder’s same-edge replacement at full capacity.

If the queue depth is not a power of two, make the pointer return to zero after the last slot. A three-bit pointer can represent 0–7, but a five-entry queue has only slots 0–4.
