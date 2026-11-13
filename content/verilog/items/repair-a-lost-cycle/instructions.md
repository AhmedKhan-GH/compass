A model public-address system delays one speaker's audio samples so they line up with another path. Its recorder should deliver the previous captured sample, but two replacement versions upset that timing by delivering samples too early or too late. You are writing the acceptance testbench that distinguishes both mistakes from the intended delay, using the supplied recorder as the component under test.

## Required behavior

recorder has one-bit clk and synchronous active-high reset, eight-bit sample, and eight-bit recorded. After reset, the recorded output at each rising edge is the sample from the preceding rising edge; the first result is zero. It holds between edges.

For samples 11, A2, 3C, F0 hexadecimal at consecutive rising edges, expected recorded values are 00, 11, A2, 3C. Your checker must accept this behavior and reject the supplied one-stage and three-stage alternatives. Drive away from rising edges, allow register updates to settle, and use a finite timeout and one CHECK_PASS/CHECK_FAIL verdict.

## Before you code

How will your checker remember the expected history independently of the DUT? Which sequence makes an early and a late result visibly different?

## Check your reasoning

Write a table showing each input before the edge and the expected output afterward. Compare against that table, including the first result after reset.

Keep the supplied module interface. **Run tests** checks the whole problem. Use the first mismatch to work out what needs to change.
