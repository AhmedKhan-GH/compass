## 1. Establish a timed baseline

Initialize every input the bench drives. Change data on falling edges, then check after a rising edge and a short settling delay.

## 2. Prove capture happens at the right time

Use different values around successive edges. Check that the output holds between captures, and make the watchdog end with a failure if the inspection gets stuck.
