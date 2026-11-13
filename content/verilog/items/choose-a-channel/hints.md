## 1. Choose A or B with one control bit

In a conditional expression, a true condition chooses the value after `?`. A false condition chooses the value after `:`. Both data choices need four bits.

## 2. Choose A or B with a two-bit code

Use comparisons to recognize the supported codes. Include a final choice for every unsupported code.

## 3. Add a switch that selects override_data

The final selection is between the decoded sensor reading and the service pattern.
