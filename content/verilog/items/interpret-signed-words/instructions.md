A mountain hut's thermometer has to make sense of freezing nights as well as warm afternoons. The staff need to compare its reading with an adjustable warning limit and show the same temperature on a wider display, even when the number is negative. You will connect those functions so adding more display bits or comparing across zero does not change what the sensor's reading means.

Inputs `temperature` and `limit` are signed eight-bit values. Outputs `below_limit` and `negative` are one-bit indicators. Output `extended` is a signed twelve-bit version of the reading. All values here are whole-number temperature readings.

Keep the supplied interface. Work through the tasks in order; **Run tests** checks them all, so later tasks may remain unfinished while earlier ones pass.

## 1. Compare signed temperatures

The hut needs a warning when the temperature falls below its chosen limit. Build the comparison so a freezing reading is treated as a negative number, rather than as a large unsigned value.

Set `below_limit=1` exactly when the signed value of `temperature` is less than the signed value of `limit`. Set it to `0` otherwise; equality does not count as below.

**Reason it through:** Would comparing the raw patterns as positive numbers correctly order -5 and +3?

**Check your reasoning:** Check -5 versus +3, then -5 versus -6, then equality. Both mixed-sign and negative-only cases matter.

## 2. Sign-extend the reading

The display has more bit positions than the sensor, but those extra positions must not change the temperature. Produce the wider reading and a separate below-zero indicator for the display to use.

The signed twelve-bit output `extended` must represent exactly the same number as `temperature`. Set `negative=1` for temperatures from `-128` through `-1`, and `negative=0` for `0` through `127`.

**Reason it through:** Which new high bits preserve the value of a negative reading? How does zero differ from a negative value?

**Check your reasoning:** Compare the binary encodings of -5 before and after extension, then do the same for +5.
