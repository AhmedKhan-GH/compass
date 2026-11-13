During a busy shift at the bakery, someone can close the cooler door before another staff member notices its alarm. A live indicator tells them what is happening now, but a second indicator needs to remember an alarm that was sampled earlier. Give the staff both views, with a way to acknowledge the remembered warning while the live condition remains visible.

clk, synchronous active-high reset, alarm, and acknowledge are one bit. immediate_warning and stored_warning are one-bit outputs.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Separate live and stored information

The bakery staff need to see whether the cooler alarm is active now and whether it was seen earlier. Give those two indicators separate timing so a remembered warning does not hide the current condition.

immediate_warning follows alarm combinationally. stored_warning reflects the held warning state. Raising alarm between clock edges must affect the immediate output while the stored output waits.

**Reason it through:** The door alarm rises halfway through a clock interval. Which indicator should respond immediately, and which must wait until that condition is sampled?

**Check your reasoning:** Raise alarm halfway through a cycle. Compare both outputs before and after a rising edge.

## 2. Define when the memory changes

A staff member needs to clear a warning after noticing it, even if the live alarm is still active. Define how the stored warning responds to acknowledgement, a new alarm, and reset.

At a rising edge, reset clears the stored warning. Otherwise acknowledge clears it, even if alarm is also high. Otherwise alarm sets it; with neither input, hold. Clearing alarm alone must not clear the remembered warning.

**Reason it through:** The baker acknowledges while the door alarm remains high. What should each indicator show under this exercise's policy, and how does it differ from the earlier sticky-alarm exercise?

**Check your reasoning:** Set the stored warning, lower the live alarm, then acknowledge. Also test both controls high on one edge.
