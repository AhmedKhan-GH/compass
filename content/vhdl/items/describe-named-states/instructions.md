At a garden railway, the operator requests a GO signal for the next train and later indicates that the section is clear, but the signal must remember its place in the sequence while those controls change. Give it a controller that follows the STOP, GO, and CAUTION sequence, shows one indication at a time, and returns to STOP when reset.

clk, synchronous active-high reset, request, and clear are one bit; stop, go, and caution are one-bit indicators. Exactly one indicator must be high, describing the registered state.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Follow the normal signal sequence

The railway operator requests GO, then signals when the train has cleared the section. Build the normal sequence so the signal holds each indication until its next step is due.

Reset initially selects STOP. In STOP, request advances to GO; without request it holds. In GO, clear advances to CAUTION; without clear it holds. CAUTION lasts one clock interval and returns to STOP at the next rising edge. Other inputs do not change these rules. Build the state transitions and their matching indicators together.

**Reason it through:** A request matters while stopped, while clear matters once the train is allowed through. Draw when each state changes and when it holds. What makes CAUTION return to STOP by itself?

**Check your reasoning:** After reset, use a request edge, a hold edge, a clear edge, and one more edge. Predict the complete indicator sequence.

## 2. Make reset and recovery dependable

The operator can reset the signal in the middle of a sequence, and the simulation can expose an unused state value. Make both situations return to STOP without showing conflicting indications.

Reset must select STOP from any operating state, even when request or clear is also high. The unused encoding must display STOP and recover to STOP on the next edge. Keep all normal transitions working.

**Reason it through:** Reset may arrive after the signal has already left STOP. What would a startup-only reset miss if the operator resets from GO or CAUTION?

**Check your reasoning:** Reset from GO and again from CAUTION. Check that no two indicators are ever high together.
