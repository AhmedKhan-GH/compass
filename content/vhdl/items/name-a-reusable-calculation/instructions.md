A laundromat groups its washing machines into three banks of eight, with a display showing how many machines are running in each group. Although every display needs the same counting rule, the attendant must still be able to tell the groups apart. You are writing a reusable calculation for their separate readings so the counting logic can be maintained in one place without mixing their results.

Inputs `channel_a`, `channel_b`, and `channel_c` are independent eight-bit words. Four-bit outputs `count_a`, `count_b`, and `count_c` report their matching counts. Complete the supplied count_ones function and reuse it.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Define the reusable count

The first bank of washing machines needs a count of how many are running. Complete the reusable calculation for that bank first, including the case where every machine is in use.

First make count_a report the number of set bits in channel_a through count_ones. The answer ranges from 0 through 8.

**Reason it through:** Which input and result widths can represent every possible machine count?

**Check your reasoning:** Check a zero byte, one set bit, and all eight bits set. Returning only three bits would lose the final answer.

## 2. Keep channel results independent

The other two banks now need their own counts on the status board. Reuse the same calculation for each bank without accidentally copying the first bank's reading into all three displays.

Use the same calculation for B and C. Each output must depend only on its matching channel.

**Reason it through:** Which argument belongs to each bank? How would changing just one bank expose a wrong connection?

**Check your reasoning:** Set the three inputs to patterns with 1, 2, and 3 active bits. Then change only one channel and observe which result changes.
