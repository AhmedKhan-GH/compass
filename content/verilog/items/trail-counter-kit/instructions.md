Park staff carry a small arrival counter during trail surveys, using a lamp to notice when the displayed total reaches a chosen milestone. Different surveys need different counter widths and targets, but the workshop wants to maintain one design. Organize the kit into a shared header and connected modules so it can be configured for each survey without maintaining a separate version for each one.

This exercise has **four editable files**:

| File | Job |
| --- | --- |
| `trail_defs.vh` | Set the shared default width. |
| `counter.v` | Count arrivals. |
| `indicator.v` | Decide when the milestone lamp is on. |
| `top_module.v` | Connect the counter and lamp. |

Keep the supplied module names, ports, and parameter names. All values are unsigned. `WIDTH` is 1–8, and `WARNING_AT` fits in that width. The supplied arrival pulses are already synchronized to the clock.

The one-bit `busy` output controls the milestone lamp. The lamp follows the displayed count, so wrapping or resetting the count clears it when the threshold is above zero.

## 1. Give the kit a shared, overridable default

The workshop wants one standard counter size, while allowing a particular build to choose another. Put that default in the shared header so every module can use the same starting configuration.

In `trail_defs.vh`, make `TRAIL_COUNT_WIDTH` default to **8** when the build has not defined it. Preserve a value explicitly supplied by the build instead of replacing it. Keep the header safe to include more than once.

**Reason it through:** Why can one header set a common default while a particular module instance still needs its own parameter?

**Check your reasoning:** The grader includes the header twice, first in a normal build and then in a build that selects a 5-bit default. The values must be 8 and 5 respectively.

## 2. Make the counter reusable

Different trail surveys may need different display sizes, but the counting rule stays the same. Complete one reusable counter that records arrivals, holds during quiet cycles, and starts a fresh count on reset.

Complete `trail_counter` in `counter.v`. On a rising edge, active-high `reset` clears `visitors`, even if `arrival` is also 1. Otherwise an arrival increments the count by one; without an arrival it holds. A count at the largest `WIDTH`-bit value wraps to zero on the next arrival. The output does not change between rising edges.

**Reason it through:** A 4-bit counter should roll from 15 to 0; an 8-bit counter should continue past 15. Which configuration belongs to each instance, and which is only a project default?

**Check your reasoning:** The counter is tested independently of the lamp and top-level wiring, with several instance widths. Compare hold, wrap, and reset-priority results before assembling the kit.

## 3. Make the milestone lamp reusable

Park staff use the lamp to notice when the displayed count reaches their chosen milestone. Give each lamp instance its own threshold so the same design can serve surveys with different targets.

Complete `trail_indicator` in `indicator.v`. `busy` must be 1 when `visitors` is greater than or equal to `WARNING_AT`, and 0 below it. It follows the count combinationally, without a clock or stored state.

**Reason it through:** With a threshold of 6, what should counts 5, 6, and 7 display? How can two lamp instances use different thresholds in the same project?

**Check your reasoning:** This module is tested on its own with multiple widths and thresholds. Those three boundary counts must produce 0, 1, and 1; changing the count back below the threshold must clear the lamp immediately.

## 4. Assemble a complete entrance kit

The counter and lamp can now be checked separately, but staff need them in one working kit. Connect the modules so the lamp follows the displayed total and both use the requested configuration.

Complete `top_module.v` by connecting one counter and one indicator. Pass the top module's width to both instances and its warning threshold to the indicator. The external `visitors` and `busy` outputs must show the connected counter and lamp.

**Reason it through:** Which top-level parameter must reach both modules, and which applies only to the lamp? What would still pass at the default configuration if one override were forgotten?

**Check your reasoning:** The assembled kit is checked with the standard configuration and a different width and threshold. Inspect its Circuit view: the count register, increment operation, and threshold comparison should now belong to one connected design.
