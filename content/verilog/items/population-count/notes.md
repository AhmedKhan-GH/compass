# IV-052: Lamp counter

Combines a bounded twelve-bit population count with a programmable power budget. Four-bit count represents 0 through 12; over_limit means count is strictly greater than the four-bit limit. Equality does not exceed the budget.

The grader enumerates all 4,096 lamp words with varying limits and checks selected population patterns against all sixteen limits. Incorrect variants omit one lamp from the loop or use an inclusive threshold. Both must fail by an assertion. The starter supplies only unfinished outputs.
