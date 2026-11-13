A mountain visitor center uses readings from a remote weather station to tell staff how cold it is outside. Each radio packet squeezes the temperature into eight bits alongside other information, so copying those bits into a larger display is not enough to preserve their meaning. Build the conversion stages that keep below-zero readings, calibration corrections, and display units consistent.

The low eight bits of `packet` contain a signed two's-complement temperature in whole degrees Celsius (-128 through 127). The high eight bits are unrelated radio information and must not affect any result. `calibration` is an **unsigned**, nonnegative correction from 0 through 255 degrees; the large range is deliberate so every sign and width boundary can be tested.

## 1. Recover the below-zero reading

The visitor center still needs an accurate reading on freezing nights. Recover the signed temperature from the packet so a below-zero reading keeps its meaning and unrelated radio information stays out of the result.

`temperature` must express the packet's temperature field as a signed ten-bit value. Preserve the meaning of every eight-bit pattern, including readings below zero.

**Reason it through:** The low byte `8'hFD` means -3 degrees here. Why might copying a selected field into a wider output instead produce 253?

**Check your reasoning:** Compare packets `16'h00FD` and `16'hA5FD`: both must report -3. Check the minimum reading (-128) and the largest positive reading (127) too.

## 2. Apply a nonnegative calibration

The station adds a calibration correction to the reading. Keep large corrections from turning negative, and preserve the sign of the corrected temperature.

`calibrated_temperature` must equal the signed temperature plus the unsigned correction. Its signed ten-bit range is enough for every allowed result (-128 through 382).

**Reason it through:** A correction of `8'hFF` means +255, not -1. How can both operands be represented as signed values without changing the correction's meaning?

**Check your reasoning:** A reading of -3 with correction 2 must become -1. With correction 255 it must become 252. Check a result that crosses zero and another that exceeds 127.

## 3. Prepare the display's finer unit

The visitor-center display uses thousandths of a degree even though this sensor measures whole degrees. Convert the corrected reading into the display unit without losing the sign or overflowing an intermediate calculation.

`display_millidegrees` must be the calibrated temperature multiplied by 1000, represented as a signed twenty-bit value. No fractional measurement is being invented: 7 whole degrees is displayed as 7000 millidegrees.

**Reason it through:** Determine the smallest and largest possible products before choosing intermediate widths. Can a wide output recover bits already lost in a narrower calculation?

**Check your reasoning:** Check results of -128000, -1000, 0, and 382000. Waveforms shows words in hexadecimal; interpret each as a twenty-bit two's-complement value. Its sign and size must agree with the corrected whole-degree reading.
