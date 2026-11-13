A small plotter accepts manual position adjustments along three axes, with each requested offset indicating a distance in a positive or negative direction. The permitted offsets run from -40 to 60 steps, so a request outside that range needs to be limited to its nearest boundary while an allowed adjustment stays unchanged. Your job is to apply this same rule independently to all three axes.

## Required behavior

sample_a, sample_b, and sample_c are signed eight-bit inputs; clamped_a, clamped_b, and clamped_c are their signed eight-bit outputs. Values below -40 become -40, values above 60 become 60, and all values between those boundaries pass unchanged.

Use one reusable function for the calculation. The channels remain independent and combinational. For inputs -41, -40, 60, and 61, the corresponding answers are -40, -40, 60, and 60.

## Before you code

How will the function keep negative inputs and return every allowed result? How can you prove that clamping one channel does not alter another?

## Check your reasoning

Use an out-of-range negative input on A, an in-range input on B, and an out-of-range positive input on C at the same time. Then exchange them.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
