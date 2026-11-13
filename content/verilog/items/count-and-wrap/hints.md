## 1. Count through every three-bit position

Use the old stored count to calculate the next count inside the clocked procedure. Disabled edges must leave it unchanged.

## 2. Fit a six-position display

Check for the last allowed zone before deciding whether to add one or return to zero. Natural three-bit overflow happens too late for six zones.
