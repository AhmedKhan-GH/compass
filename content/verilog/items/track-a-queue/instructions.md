A photo booth can take new print requests while its printer is still working through earlier ones. There are five waiting places to manage, and reusing a place must not confuse an empty queue with a full one. Start with the bookkeeping: track how many requests have been accepted and which place will be written or read next, before adding the print data itself.

Build control state for DEPTH=5 and ADDR_WIDTH=3. clk and synchronous active-high reset are one bit; push and pop are one-bit requests. count has ADDR_WIDTH+1 bits; write_ptr and read_ptr have ADDR_WIDTH bits. empty and full are one-bit combinational flags for occupancy zero and DEPTH.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Track accepted pushes

The photo booth needs to remember where each waiting print belongs. Track new print requests until all five places are occupied, and stop accepting requests when there is no room left.

Reset clears count and both pointers. With pop=0, each accepted push advances write_ptr once and increases count until the queue is full. Further pushes at full capacity change nothing. Addresses cycle through 0,1,2,3,4,0.

**Reason it through:** After five accepted print requests the write pointer returns to the first slot, but the queue is full. Why must occupancy distinguish that state from an empty queue whose pointer is also zero?

**Check your reasoning:** Fill from empty and compare count, full, and write_ptr after every edge. A sixth push must not overwrite the queue’s control state.

## 2. Combine reads and writes

The printer can take a waiting job while the camera submits another. Track both requests together so the number of waiting prints stays accurate and each pointer moves only when its operation is accepted.

An accepted pop advances read_ptr and removes one entry. Decide which requests to accept using the full/empty flags from before the edge. Accepted push alone increases count, accepted pop alone decreases it, both together preserve it, and neither holds everything. Each pointer advances only for its own accepted operation; reset still wins.

**Reason it through:** The printer and camera may request a pop and push together. At full or empty capacity, are both requests actually accepted using the flags from before the edge, or does only one change the occupancy?

**Check your reasoning:** From count=2, write_ptr=4, read_ptr=1, accept both operations: expect count=2, write_ptr=0, read_ptr=2. Then test simultaneous requests at full and empty separately.
