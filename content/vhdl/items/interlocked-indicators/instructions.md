Two packing lines feed one labelling station, so a new request cannot simply displace the line already using it. Each line needs to keep its turn until it releases the station, with an idle interval before the next turn begins. Your controller will remember which line has permission and handle competing requests without ever granting both at once.

## Required behavior

All ports are one bit. clk samples rising edges; reset is synchronous and active high. request_a and request_b ask for permit_a and permit_b. Reset clears both permits.

When idle, a request for A wins if both requests are high; otherwise B may obtain permission. Once a line has permission, retain it while its own request remains high, ignoring the other request. When its request falls, return to an idle interval with both permits low. A waiting other-line request is considered only at the following edge. Outputs depend on stored ownership and hold between edges.

Requests 11,01,01 after reset produce permits 10,00,01.

## Before you code

What states are needed to remember ownership? Why is an immediate A-to-B switch different from the specified quiet interval?

## Check your reasoning

Exercise both handoff directions, simultaneous requests, held requests, and reset during a grant. Check why both permits can never be high together.

Keep the supplied entity interface. **Run tests** checks the whole problem. Use the first mismatch to decide what to investigate next.
