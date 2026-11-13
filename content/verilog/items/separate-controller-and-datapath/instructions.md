A customer presses the arcade change machine's button to request a token payout, then presses again while it is still counting. The machine needs to finish the amount it accepted without restarting or changing the payout halfway through. Organize its controller and stored counts so it can carry out that job, report completion, and handle a request that needs no tokens.

`amount` is an unsigned eight-bit requested token count. clk, synchronous active-high reset, start, busy, and done are one bit; dispensed is eight bits. Requests are accepted only when idle.

Keep the supplied interface. **Run tests** checks every task; earlier tasks can pass while later ones are unfinished.

## 1. Complete a nonzero request

A customer requests a token payout, and the machine must finish that amount before returning to idle. Track the tokens dispensed and report completion when the last token has been counted out.

An accepted nonzero start clears dispensed and begins work. Each subsequent busy rising edge adds one to the number dispensed. The edge that dispenses the final item lowers busy and raises done for one clock interval. Keep the completed count visible while idle. Reset cancels work and clears state.

**Reason it through:** The start edge accepts the requested amount before any token is dispensed. Which stored quantities distinguish tokens still owed from tokens already counted out?

**Check your reasoning:** For amount 3, the start edge reports busy/dispensed=1/0, then work edges report 1/1, 1/2, and 0/3 with done=1 only at completion.

## 2. Handle empty and competing requests

A customer may press again during a payout, or the machine may receive a request for zero tokens. Handle those cases without changing a payout already in progress or leaving an empty request running.

An idle start with amount zero completes immediately: done=1, busy=0, dispensed=0 after that edge. Starts while busy are ignored, including on the final work edge. Changing amount during work must not change the accepted transaction. Reset wins over everything and done clears on the next ordinary edge.

**Reason it through:** A zero-token request needs no working edge. A second press on the final payout edge still belongs to a busy job: which inputs must be ignored, and which accepted values must remain stored?

**Check your reasoning:** Check zero, one, and a new request during a payout. Reset midway and confirm the cancelled work does not resume.
