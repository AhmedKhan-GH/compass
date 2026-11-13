# IV-008: Choose a channel

Concept package teaching `selection`; prerequisite `words`, after Boolean controls
and the Status word lesson. The only new operator is conditional `?:`.
Equality, sized literals and vectors are reused. Nested conditions introduce
complete defaults and priority. Reading an already driven output as a named
connection is explained explicitly before task 3.

Three assignments give three independently checkable coached tasks in one
combinational module. Task 1 begins with one control and two words; task 2 adds
code equality and fallback; task 3 composes the decoded result with an override.
This avoids requiring procedural assignments, a sensitivity list, loops, clocks,
arithmetic, module instances, or SystemVerilog.

Tests enumerate all 256 pairs of four-bit channel words, both select values, and
all four channel codes for the first two tasks. The override test enumerates all
4,096 triples of channel/override words, four codes and both override levels.
Every test initializes every input, and changes inputs without a clock. Values
are checked as binary strings so an undriven X/Z becomes an expected/actual failure.
Unknown-input semantics are intentionally deferred.

The reference passes; the compiling all-zero starter fails. Three compiling wrong
examples independently reverse the basic choice, omit the unused-code default,
and put a valid channel ahead of the override. These catch distinct conceptual
mistakes; a compile error never counts as proof of grading quality.

## Independently executable tasks

The three instruction sections and metadata map directly to the three output-specific test functions. Each task carries its own syntax explanation, example, concrete edit and prediction. Keep other unfinished outputs compilable so the learner can run only the selected task. Earlier tests remain valid after later selector outputs are completed.
