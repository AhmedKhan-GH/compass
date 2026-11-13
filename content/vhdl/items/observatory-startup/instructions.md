Before a night's observations, the observatory's startup routine needs to know when its camera is ready. Sometimes that happens before the routine checks; on other runs the camera takes longer or never becomes ready at all. Write simulation helpers that handle both present and future readiness, with a separate bounded check that can report when startup has missed its deadline.

The checker process schedules one-bit `camera_ready` scenarios and calls your two procedures. Keep their signatures unchanged; they observe readiness and return results without changing it.

VHDL delays carry explicit units: the bounded helper samples every `1 us`, while the fixture also schedules readiness using nanosecond values such as `2400 ns`.

## 1. Continue when the camera is ready now or later

The camera may finish starting before the helper is called, or it may still be getting ready. Make the helper continue as soon as readiness is confirmed in either situation.

Complete `await_ready`. If `camera_ready` is already exactly 1, return immediately without advancing simulation time. Otherwise, wait until it becomes exactly 1, then return at that instant. Values of `x` or `z` do not count as readiness.

This helper has no deadline; the fixture makes the camera ready later when needed.

**Reason it through:** Predict the difference between calling it while readiness is already high and calling it before readiness rises. Is a future edge required in both cases?

**Check your reasoning:** The fixture checks that an already-ready call consumes no time, while a waiting call returns exactly when readiness becomes 1.

## 2. Give startup a bounded deadline

The observatory also needs a startup check that can report a failed start instead of waiting forever. Check readiness on a fixed schedule and return a result by the stated deadline.

Complete `check_startup(limit_us, succeeded)`. Sample readiness immediately on entry. If it is 1, return success immediately. Otherwise sample once per microsecond, up to and including the sample at `limit_us` microseconds after entry. Return success at the first ready sample; if every sample fails, return failure at the deadline. A zero limit permits only the immediate sample.

The input limit is a nonnegative integer. Unknown readiness counts as not ready. For example, with a 3 us limit, samples occur at elapsed times 0, 1, 2, and 3 us. If readiness rises at 1.4 us, success is reported at the 2 us sample. A rise at 3.4 us is too late.

**Reason it through:** For a 3 us limit, how many observations are allowed, including the immediate observation? What changes when the limit is zero?

**Check your reasoning:** The fixture includes already-ready, late-ready, never-ready, and zero-budget cases. Inspect the elapsed time as well as the returned flag: a routine that eventually notices readiness can still miss its deadline.
