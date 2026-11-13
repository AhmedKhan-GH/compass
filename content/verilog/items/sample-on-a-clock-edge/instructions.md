An athlete's training monitor places the latest captured sensor reading beside the preceding one so the two can be compared. Although the sensor keeps changing, the pair needs to remain steady between display updates and move forward together when the clock ticks. You are building the monitor's memory so a new reading can take its place without losing the older reading needed for comparison.

Inputs `clk` and `reset` are one bit. Input `sample` and outputs `captured` and `previous` are eight-bit readings. Reset is active high and acts on a rising clock edge. Between rising edges, both outputs must hold.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Capture one sample

The athlete needs the latest reading to stay visible while the live sensor moves on. Build the first display window so it captures a reading at the clock edge and keeps it between updates.

After each non-reset rising edge, captured must equal the sample present immediately before that edge. A reset edge makes captured zero.

**Reason it through:** If the sensor changes twice before the next rising edge, which value should the monitor capture?

**Check your reasoning:** Change sample while the clock is low and confirm captured holds. Then cross one rising edge and compare the two signals in Waveforms.

## 2. Preserve the preceding sample

The second window should help the athlete compare the new reading with the one it replaced. Preserve that earlier reading as the first window updates, so each window keeps its intended place in the reading history.

After a non-reset rising edge, previous must equal what captured held before that edge. Reset clears both outputs. With captured=24 and sample=A1 hexadecimal before an edge, afterward captured is A1 and previous is 24.

**Reason it through:** After an update, should the two windows show the same new reading or two successive readings?

**Check your reasoning:** Use three distinct consecutive samples and annotate the two output traces. Repeating one sample would hide an accidental same-cycle copy.
