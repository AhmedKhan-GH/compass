A gallery door contact sometimes bounces open and closed for a moment when a visitor enters. Sending every bounce to the audible chime would produce a false extra ring, but the maintenance trace must preserve those edges so a technician can see what happened. Complete the two delayed assignments in `door_chime`, giving the audible and diagnostic paths their different timing behavior.

## 1. Reject a short bounce

Assign `chime` with a 5 ns inertial delay and explicitly reject pulses shorter than 3 ns.

Model the audible path as a filter: a contact pulse must last at least 3 ns to survive, and an accepted transition reaches the chime after 5 ns.

**Reason it through:** Why does cancellation of a pending transaction filter a narrow pulse?

## 2. Preserve delayed contact events

Assign `trace` with a 5 ns transport delay so every input event appears later, including the short pulse.

The trace is evidence rather than a physical filter. Preserve both edges of a bounce and shift each edge by the same 5 ns.

**Reason it through:** At what time should each edge of a two-nanosecond pulse appear?
