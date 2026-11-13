After a museum exhibit is moved, its reconnected wiring model produces uncertain lamp signals in the simulator. Before relying on the model, the installer needs you to repair a missing connection and a second connection with competing drivers, then add a comparison light for two definite test signals. Following these signals will help you distinguish a lamp driven low from a connection that has no reliable value.

Inputs `source`, `left_signal`, and `right_signal`, and outputs `connected`, `same`, and `conflict_free` are all one bit. `connected` and `conflict_free` are two separate lamp connections that must follow `source`. Output `same` reports whether `left_signal` and `right_signal` match.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Restore the missing connection

The first lamp connection has no signal reaching it in the simulation. Trace where that signal should come from and restore the connection so the lamp can follow both source values.

connected must follow source for both 0 and 1 and after repeated changes.

**Reason it through:** What does `z` suggest about the connection? Would tying it to zero make both source values work?

**Check your reasoning:** Inspect connected before and after repair, then toggle source. Distinguish an undriven signal from a signal driven low.

## 2. Compare definite inputs

The installer wants a comparison light to check two test signals before reconnecting more of the exhibit. Add a clear match or mismatch result for every pair of known input values.

same is 1 when left and right match and 0 when they differ. The checked inputs here are known binary values.

**Reason it through:** What result belongs to each of the four known input pairs? How would an unknown input change the comparison?

**Check your reasoning:** Predict all four pairs and inspect the one-bit result. This task checks ordinary equality, not an x detector.

## 3. Resolve the competing driver

The second lamp connection behaves correctly for one source value but becomes uncertain for the other. Find the competing driver and repair the connection so both source values have a definite result.

conflict_free must follow source without becoming x or z for known inputs.

**Reason it through:** What happens when two drivers give different values? Does the last assignment replace the first?

**Check your reasoning:** Drive source both low and high after repair. A conflict can be hidden by the one input value where the drivers agree.
