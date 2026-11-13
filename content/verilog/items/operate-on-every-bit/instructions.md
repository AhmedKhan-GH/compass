A bicycle light designer is trying out patterns for a row of eight LEDs and wants to compare variations without editing the original each time. Seeing light and dark positions exchanged, or hiding part of the row, makes those comparisons easier. You will build three preview views, including one with a single control that switches the whole row between the original pattern and its opposite.

`status[7:0]` is the original pattern: a `1` means that LED is lit. `mask[7:0]` controls the previews. The eight-bit outputs `inverted`, `kept`, and `toggled` are independent views, not successive animation frames. The third view uses only `mask[0]` as its global control; the other views use the word as described below.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Invert the word

The designer wants to see the same bicycle-light pattern with its light and dark positions exchanged. Build this preview so they can compare the two designs without changing the original pattern.

Each bit of `inverted` must be the opposite of the corresponding bit of `status`. All eight positions are independent.

**Reason it through:** If only the top input bit changes, how many output positions should change?

**Check your reasoning:** Predict the inverted word for 00110101 and then confirm it in Circuit.

## 2. Select the visible positions

The designer now wants to inspect only part of the light row. Add a view that hides the unwanted positions while leaving the selected lights as they appear in the original pattern.

For each position in `kept`, a mask bit of `1` passes the corresponding `status` bit, and a mask bit of `0` forces the output bit to `0`. Keep `inverted` working.

**Reason it through:** Does one mask position control the whole word or only its matching light?

**Check your reasoning:** For status=10100101 and mask=11110000, expect kept=10100000. Change one mask bit and predict the one affected position.

## 3. Toggle the whole display

Comparing the original and inverted patterns is easier with one switch than with eight separate controls. Add a third preview that changes the whole row at once, using the designated control bit.

When `mask[0]=0`, `toggled` equals `status`. When `mask[0]=1`, every bit of `toggled` is the opposite of its `status` bit. Other mask bits must not affect this output.

**Reason it through:** How can one control apply the same choice independently to eight positions?

**Check your reasoning:** Compare masks 11110000 and 11110001 with the same status word. Then change only an upper mask bit: toggled must stay unchanged.
