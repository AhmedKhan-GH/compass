A bicycle indicator kit uses separate left and right controls, but some replacement wiring harnesses send those commands to the wrong lamps. Lighting both lamps together can make a faulty harness look healthy, so the workshop needs a checkout that establishes what each control actually does. Your job is to write the testbench that accepts a correctly signald kit and exposes the supplied wiring mistakes.

This model checks steady lamp commands only; flashing and physical button behavior are outside the exercise.

## Required behavior

Entity `harness` has `std_logic` inputs `left_signal`, `right_signal`, and `enable`, plus `std_logic` outputs `lamp_a` and `lamp_b`. With `enable = '0'`, both lamps are off. With `enable = '1'`, `lamp_a` follows `left_signal` and `lamp_b` follows `right_signal`. There is no clock.

Your testbench must accept the correct entity and reject the supplied faulty alternatives. After assigning stimulus with `<=`, use `wait for 1 ns;` to let scheduled signal updates settle. Compare the `std_logic` outputs directly; this nine-value type includes meta-values such as `'U'` and `'X'`, and neither equals an expected `'0'` or `'1'`. Report useful mismatch details, then finish with exactly one `CHECK_PASS` or `CHECK_FAIL` verdict derived from an error count.

## Before you code

Choose cases that separate the supplied swapped-wire and shared-input harnesses from the correct circuit. Also consider which cases would expose a stuck lamp or ignored enable. Explain which fault each case would catch.

## Check your reasoning

Light the left lamp alone, then the right alone, then disable the kit while a lamp is lit. A test that checks only startup darkness may miss a fault.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
