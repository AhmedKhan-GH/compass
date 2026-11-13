# Darkroom timers

Separate timed single-call correctness from overlapping invocation lifetime. Static implementation is an intentional task-1 partial, accepted for sequential calls and rejected for overlap. The fixture checks lamp timelines rather than learner verdicts, and overlaps distinct channels only; automatic lifetime does not repair racing writes to the same shared channel.
