When a water-storage tank reaches its configured level limit, the control cabinet raises an alarm. A technician needs a way to silence that alarm while a separate service indicator continues to show whether the tank is high. You are adapting the cabinet around its existing, tested comparison component, so the new alarm control must leave that useful reading available.

The supplied read-only `level_compare` module has unsigned eight-bit inputs `value` and `threshold`. Its one-bit output `at_or_above` is `1` when `value` is at least `threshold`.

Your parent module has unsigned eight-bit inputs `level` and `limit`, one-bit input `enable`, and one-bit outputs `raw_high` and `alarm`. Use the supplied component for the comparison.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Connect the comparison component

The service indicator needs to show the tank level even when the alarm is switched off. Start by connecting the tested comparison component so the indicator gets its own unchanged result.

raw_high must report whether level is at or above limit, regardless of enable. Keep the child’s named interface intact.

**Reason it through:** Which parent input connects to `value`, and which connects to `threshold`? Once the child drives the result, does that wire need another driver?

**Check your reasoning:** At level=80 and limit=80, raw_high is 1. Try values either side of that boundary and trace the child connections in Circuit.

## 2. Apply the cabinet permission

The installer now needs a way to silence the alarm without hiding a high tank reading. Add the alarm permission while leaving the service indicator connected to the original comparison.

alarm is active only when the raw comparison is high and enable is 1. Disabling the cabinet must not change raw_high itself.

**Reason it through:** Where can the enable check go without changing the comparison used by the service indicator?

**Check your reasoning:** Hold a high level and toggle enable. Only the final alarm should change.
