## 1. Mark every fourth edge

Use a small counter to track the four ticks. Define the pulse on the last tick and clear it on the other ticks.

## 2. Count completed updates

Use the same before-edge condition that creates the pulse to update the count. Reading the stored pulse on that edge would read its previous value.
