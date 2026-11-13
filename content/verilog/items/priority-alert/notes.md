# IV-010: Priority alert

Practice of `selection`, `words`, and `boolean-logic`, requiring `selection`.
Three named signals become an ordered choice and an independently derived
validity signal. The learner composes nested conditional selection, sized word
literals and Boolean OR. No new operator, alert-domain knowledge, or sequential
behavior is needed.

Tests include the no-alert combination, each single alert, all pairwise conflicts,
all three together, and a sequence clearing/raising alerts while checking both
outputs. The first three tests cover all eight input combinations; the final
sequence checks return to idle and transitions through lower priorities.

The reference passes; the all-zero starter compiles and fails. Distinct compiling
wrong examples reverse priority, derive validity from critical only, and return
the advisory code when no alert is active. Binary-string expected/actual messages
make undriven outputs an understandable failure rather than a conversion error.
