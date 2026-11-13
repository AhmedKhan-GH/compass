## 1. Time each exposure

Replace the one-nanosecond placeholder with `wait for duration;`. The formal `lamp` is already a signal parameter, so its assignments affect only the associated element.

## 2. Preserve overlapping calls and report completion

Do not add shared variables or serialize workers. Parameters and `started_at` are local to each invocation. Once the checker sees all workers and lamps complete, change only its placeholder verdict.
