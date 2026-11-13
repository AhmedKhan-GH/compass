While reviewing a telescope shutter's startup simulation, the observatory team finds that some controls have not yet reached known values. A definite-looking output can hide that uncertainty, so they need to see how each kind of Verilog decision handles it. Create a simulation model that separates a confirmed request, the parts of an opening that can be determined, and an exact comparison of recorded settings.

This exercise studies how Verilog simulation handles those values. Its handling of `x` and `z` is **not** an electrical safety mechanism for a real shutter. The grader supplies real four-state values, and you will inspect them under Waveforms.

## 1. Record a definitely asserted request

The startup log needs to distinguish a request that is definitely on from one that is still unknown. Model that decision without letting an earlier request remain active when the current input does not confirm it.

`motor_request` follows this model's procedural decision: it is 1 when the one-bit `request` is 1, and 0 when `request` is 0, `x`, or `z`. It must be assigned on every evaluation, without retaining an earlier request.

**Reason it through:** Predict the four outputs for input sequence 1, `x`, 0, `z`. Why does an `if` decision sometimes report a definite 0 even when its condition is unknown?

**Check your reasoning:** Compare `request` and `motor_request` in Waveforms. A previous request of 1 must not survive an uncertain condition.

## 2. Preserve what is known about the opening

The shutter model has a manual setting and a scheduled setting, but its mode may still be unknown during startup. Show which opening bits can be determined from those two choices and which remain uncertain.

When `manual_mode` is 1, `chosen_opening` must equal `manual_opening`; when it is 0, it must equal `scheduled_opening`. If the mode is `x` or `z`, preserve each bit that agrees between the two openings and report `x` for each bit that differs. An agreeing `z` remains `z`.

**Reason it through:** If the two choices are `4'b1010` and `4'b1000`, which opening bits remain knowable even before the mode is known? Would an `if`/`else` that always chooses the scheduled value preserve that uncertainty?

**Check your reasoning:** The uncertain selection in that example must be `4'b10x0`. Also try equal choices, completely different choices, and candidate values that already contain `x` or `z`.

## 3. Compare the recorded settings exactly

The team also compares recorded manual and scheduled settings while debugging startup. Report whether the two logs contain exactly the same simulated bit states, including any unknown or undriven bits.

`readings_identical` is a simulation diagnostic. It must be 1 when `manual_opening` and `scheduled_opening` have exactly the same four-state pattern, and 0 otherwise. It must never be `x` or `z` itself.

**Reason it through:** Should two readings of `4'b1x0z` be identical in a log? Should `4'b1x0z` and `4'b100z` be identical? This question concerns the recorded states, not whether a physical opening has been measured successfully.

**Check your reasoning:** Inspect those pairs and a known mismatch. Contrast this task's definite yes/no answer with the possibly uncertain bits in `chosen_opening`.
