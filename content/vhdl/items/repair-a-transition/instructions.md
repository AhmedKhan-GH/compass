During a shop-window display test, the turntable reaches its third position and then stops advancing through the sequence. The first two moves looked correct, so a short check failed to reveal the problem. Trace the supplied controller through a complete rotation, repair the transition that keeps it stuck, and confirm that another rotation works too.

## Required behavior

clk, synchronous active-high reset, and advance are one bit. state is a two-bit registered output. Reset sets it to 0. When advance is low, it holds. On enabled rising edges the cycle is 0 → 1 → 2 → 0. Advancing from unused code 3 recovers to 0.

After reset, four enabled edges must produce 1,2,0,1. Reset takes priority over advance from every state.

## Before you code

Draw the required transition graph and compare it with the supplied code. Which input sequence reaches each transition without masking the defect?

## Check your reasoning

Run the starter long enough to repeat the cycle, then repeat the same test after repair. Insert holds and a reset midway through the sequence.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
