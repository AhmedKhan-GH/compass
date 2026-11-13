In a wind-tunnel test, sensor readings arrive in bursts while the display pauses between updates. A reading accepted during a pause must remain available in its original order when the display catches up, even after the queue reuses its storage addresses. Bring the storage and queue controls together in a design that works with several capacities, including just one waiting place.

## Required behavior

clk and synchronous active-high reset are one bit. Input transfer uses in_valid, in_ready, and WIDTH-bit in_data; output transfer uses out_valid, out_ready, and WIDTH-bit out_data. A transfer occurs at a rising edge when that side’s valid and ready are both high.

Set `in_ready` when the queue is not full and `out_valid` when it is not empty. Use these values from before the clock edge to decide which transfers happen. The output shows the oldest stored word. Keep that word and `out_valid` unchanged while the receiver is not ready. Reset discards all queued words; output data is unspecified while invalid.

Acceptance uses the queue policy from the preceding queue-control exercise: at full capacity, a simultaneous input offer and output transfer rejects the input; the pop creates room for the next cycle. At intermediate occupancy, simultaneous accepted input and output preserve the count and order.

The supplied wrapper checks WIDTH=8 at DEPTH/ADDR_WIDTH settings 1/1, 3/2, and 5/3. Addresses must stay legal at every setting.

## Before you code

Sketch storage, occupancy, and both pointers before coding. Which values must hold while the receiver waits? Which checks keep requests from reading an empty queue or writing a full one?

## Check your reasoning

At depth 3, accept A, B, C; stall and reject D; pop A; then pop B while accepting D. The remaining order is C, D. Repeat through several wraps and check reset with unread words.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
