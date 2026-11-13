## 1. Reset on a clock edge

The synchronous procedure runs only on a rising clock edge. Check reset before choosing whether to capture data.

## 2. Reset without waiting for the clock

Include the rising reset edge in the event list. Check whether reset is high before the normal data update.
