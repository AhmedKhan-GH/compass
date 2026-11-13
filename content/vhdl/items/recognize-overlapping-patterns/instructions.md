The ground receiver for a model rocket watches the incoming bits for the marker 101. Closely spaced markers can share a bit, so recognizing one must not make the next disappear from the receiver's record. Write a detector that keeps enough history to report every sampled occurrence, including those overlapping cases, and starts a fresh history after reset.

## Required behavior

clk, synchronous active-high reset, and bit_in are one-bit inputs. match is a one-bit registered result. After each rising edge, match is 1 exactly when the most recent three sampled bits form 101; otherwise it is 0. Reset clears history and match.

Samples 1,0,1,0,1 produce match values 0,0,1,0,1. The last bit of the first match may also start another match. Unsampled input changes do not advance the stream.

## Before you code

Which earlier bits must you remember after a match? Could you represent it as recent bits, named partial-match states, or both?

## Check your reasoning

Test overlapping matches, a long run of ones, and reset halfway through a potential marker. Compare results after each edge rather than only the final match count.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
