A greenhouse uses a selector to choose which of two sensor readings reaches its controller, and replacement versions need checking before installation. A part can appear to work when both readings happen to agree, even if its switch is reversed or stuck on one channel. You are writing a testbench that makes those differences observable and gives a repeatable verdict on each supplied version.

The supplied `selector` has four-bit inputs `a` and `b`, one-bit input `select_b`, and four-bit output `y`. It must return `a` for `select_b=0` and `b` for `select_b=1`. You edit `testbench.vhd`; the circuit under test is supplied separately.

Keep the supplied interface. **Run tests** checks every task; a completed task can pass while later tasks are still unfinished.

## 1. Drive and check a timed case

The greenhouse needs a repeatable way to check a replacement selector. Begin with one case whose answer you know, and make the testbench report whether the observed output agrees with it.

Connect the supplied selector, initialize stimulus and an error counter, and exercise a case with a definite expected result. Allow the output to settle before comparison and print one verdict derived from the result. The correct DUT must pass.

**Reason it through:** If both inputs have the same reading, could the test reveal a reversed selector?

**Check your reasoning:** Read the simulator output. A verdict should reflect a comparison, and a mismatch should identify the inputs, expected value, and observed value.

## 2. Distinguish both selector paths

One successful case does not prove the selector switch works in both positions. Extend the checkout so a reversed switch or stuck path cannot pass simply because the chosen readings look alike.

Extend your cases so the correct selector still passes but a selector with reversed paths or a stuck output fails. Check both control values with more than one input word.

**Reason it through:** Which inputs make the correct and faulty selectors give different answers? What could a repeated input value hide?

**Check your reasoning:** Use Run tests to see whether your checker accepts the correct DUT and rejects the alternatives. All comparisons contribute to one final verdict.
