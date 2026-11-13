## 1. Compare signed temperatures

Keep both values signed during the comparison. Otherwise, a negative bit pattern can be treated as a large positive number.

## 2. Sign-extend the reading

Copy the original sign bit into the new high positions. That original high bit also tells you whether the eight-bit signed input is negative.
