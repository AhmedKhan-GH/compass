## 1. Follow the exact spelling

Compare `decoded_stop` with the name passed to the receiver's `stop_id` port. Fix the connection rather than supplying an extra constant driver.

## 2. Declare the complete bus

An implicit net is one bit wide. The receiver's `volume` port and the public `speaker_volume` port are both four bits; the wire between them needs four bits too. Add the strict net directive only after the undeclared names are repaired.

## 3. Resolve the driver ownership

Delete both starter drivers for `play_request` and provide a single expression that requires the button and the signal. A later continuous assignment does not replace an earlier one.
