A bicycle indicator kit uses separate left and right controls, but some replacement wiring harnesses send those commands to the wrong lamps. Lighting both lamps together can make a faulty harness look healthy, so the workshop needs a checkout that establishes what each control actually does. Your job is to write the testbench that accepts a correctly wired kit and exposes the supplied wiring mistakes.

This model checks steady lamp commands only; flashing and physical button behavior are outside the exercise.

## Required behavior

Module harness has one-bit inputs left, right, and enable and one-bit outputs lamp_a and lamp_b. With enable=0, both lamps are off. With enable=1, lamp_a follows left and lamp_b follows right. There is no clock.

Your testbench must accept the correct module and reject supplied faulty alternatives. Allow #1 for settling, compare all four-state values, report mismatches, and finish with one CHECK_PASS or CHECK_FAIL verdict derived from an error count.

## Before you code

Choose cases that separate the supplied swapped-wire and shared-input harnesses from the correct circuit. Also consider which cases would expose a stuck lamp or ignored enable. Explain which fault each case would catch.

## Check your reasoning

Light the left lamp alone, then the right alone, then disable the kit while a lamp is lit. A test that checks only startup darkness may miss a fault.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
