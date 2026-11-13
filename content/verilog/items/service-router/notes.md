# IV-009: Service router

Practice of `selection`, `words`, and `boolean-logic`, with `selection` as the
prerequisite in the linear concept chain. The cohesive contract composes word
width, equality, one-bit AND, and conditional assignment. It introduces no syntax
or knowledge of a real communication protocol.

Tests exhaust all 16 data words for each of four destinations while enabled,
all 64 disabled combinations, and repeated enable/destination/data transitions.
They check all three outputs each time, including unused code 11 and all inactive
outputs. Binary-string comparisons report X/Z with useful expected/actual values.

Wrong examples ignore enable, swap lanes 1 and 2, or send unused code 11 to lane 0.
All compile; the all-zero starter compiles and fails routing tests. No sequential
constructs or hidden implementation style restrictions are part of grading.
