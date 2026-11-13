In a photography lab, three enlargers expose different prints at overlapping times. Each worker calls the same timing procedure, but one print's duration and lamp must remain independent while another call waits. Complete the VHDL procedure and verdict so the checker sees the exact combined patterns.

`lamps(0)` through `lamps(2)` control the enlargers. The three worker processes begin at 2 ns, 5 ns, and 7 ns and call `expose` with different durations. Each sets its own `done` bit after returning. Keep the procedure signature, workers, checker timing, and portless entity.

## 1. Time each exposure

Drive the associated `lamp` high, wait for `duration`, verify `now - started_at`, and drive only that lamp low. Lamp 0 stays on from 2 ns through 14 ns, lamp 1 from 5 ns through 9 ns, and lamp 2 from 7 ns through 16 ns.

**Reason it through:** Which values must a call retain while suspended at `wait for duration`?

**Check your reasoning:** At 6 ns the pattern is `011`; at 10 ns it is `101`; after `done = "111"`, all lamps are off.

## 2. Preserve overlapping calls and report completion

Leave calls in separate processes so they overlap. Each invocation already has private parameters and `started_at`; the shared object is `lamps`, whose different elements belong to different workers. Replace the placeholder final report with `CHECK_PASS`, retaining `finish` and the final `wait`.

**Reason it through:** Why are local procedure variables independent while two drivers on the same signal element would conflict?

**Check your reasoning:** Follow each lamp from its own start to its own end instead of treating calls as a serial schedule.
