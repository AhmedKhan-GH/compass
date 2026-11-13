In a photography lab, three enlargers shine images from film onto photographic paper, each for a chosen exposure time. Because photographers can start prints at different moments, the timer testbench must model several exposures running at once. Complete its shared exposure task so each call keeps its own timing and lamp, allowing a new print to start without disrupting one already in progress.

The simulation has three output bits in `lamps`: bit 0 controls enlarger 0, and so on. All lamps start off. Durations below are simulation nanoseconds, using the supplied `1ns / 1ps` timescale.

The read-only test fixture calls `expose(lamp_number, duration_ns)`. It never overlaps two calls for the same lamp. Keep that task's argument names and directions, and keep the fixture instance.

## 1. Time one exposure

One print needs its enlarger lamp on for a chosen amount of time. Build a simulated exposure that starts and stops that lamp on schedule while leaving the other two lamps alone.

Complete the task so its selected lamp turns on when called, remains on for exactly `duration_ns`, then turns off as the task returns. Other lamps must keep their previous values.

**Reason it through:** Sketch one call's start, lit interval, and return on a timeline. Which bits should remain unchanged when one enlarger turns on?

**Check your reasoning:** The fixture tries different lamps and durations one at a time. Compare each lamp's lit interval with the call's requested duration in Waveforms.

## 2. Keep overlapping exposures independent

Two photographers may start prints before either exposure has finished. Make the shared task handle those overlapping calls so starting a new exposure cannot change which lamp an earlier call will turn off.

Each call must retain its own lamp number and duration while other calls run. For example, lamp 0 starts a 12 ns exposure at time 2; lamp 1 starts a 4 ns exposure at time 5. Lamp 1 must finish at time 9, while lamp 0 stays on until time 14.

**Reason it through:** Which task values are still needed after the delay? Can another call overwrite those values while the first call is waiting?

**Check your reasoning:** The fixture also starts all three lamps together and reverses which exposure lasts longest. In Waveforms, follow each lamp separately; its end time must depend on its own start and duration.
