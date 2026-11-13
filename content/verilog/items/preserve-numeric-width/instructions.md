The parts-counter operator has run into the old display's limit: 250 parts in one bin and 10 in the other appear as a total of just 4. A replacement display can show the full answer, but the older connection still needs to work. You will provide both readings and a flag that tells the technician when the old readout has lost part of the total.

Inputs `a` and `b` remain unsigned eight-bit quantities. Output `full_sum` is nine bits, `wrapped` is eight bits, and `carry` is one bit.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Preserve the full sum

The new display should show the actual number of parts across both bins. Build its wider total first, so adding more parts cannot make the displayed quantity jump back to a small number.

The nine-bit output `full_sum` must equal the complete mathematical sum for every pair of eight-bit unsigned inputs `a` and `b`. For `250` and `10`, it must report `260`.

**Reason it through:** What is the greatest possible sum, and how many output positions are needed to represent it?

**Check your reasoning:** Compare 255+0, 255+1, and 255+255. The full total must keep increasing instead of wrapping.

## 2. Expose truncation and carry

The older display still needs its eight-bit connection. Keep that readout available and add a flag that tells the technician when it has lost a high bit, while preserving the new display's complete total.

The output `wrapped` reports the low eight bits of `full_sum`. Set `carry=1` when the total needs the ninth bit, and `carry=0` otherwise. Keep `full_sum` intact.

**Reason it through:** The old display reads 4 while the new display reads 260. What information must the carry flag add to make those readings consistent?

**Check your reasoning:** Find a pair of inputs whose wrapped result is zero but whose full result is not. Compare all three outputs in Waveforms.
