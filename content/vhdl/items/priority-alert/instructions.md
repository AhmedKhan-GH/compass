An aquarium keeper relies on a small monitor that can show only one alert at a time. A stopped circulation pump needs attention before a low water level, and both matter more than a routine filter reminder, so showing whichever message happens to arrive last would be unhelpful. You will build the selector that identifies the most urgent current alert and tells the display when there is nothing to report.

## Required behavior

Inputs `critical`, `warning`, and `advisory` are one bit. `code` is two bits and `valid` is one bit.

| Most important active alert | code | valid |
| --- | --- | --- |
| Critical | 11 | 1 |
| Warning, without critical | 10 | 1 |
| Advisory alone | 01 | 1 |
| None | 00 | 0 |

Choose critical before either other alert, and warning before advisory. Both outputs follow the current inputs, including when the last alert clears.

## Before you code

When several inputs are high, which message should the keeper see? Does `valid` depend on which alert wins, or only on whether there is an alert?

## Check your reasoning

The water level warning and filter reminder appear together. The pump then stops, and later all three conditions clear. Predict `code` and `valid` at each point.

Keep the supplied entity interface. **Run tests** checks the whole problem. Compare the first failing case with your expected result.
