A museum handset receives one beacon byte from a supplied decoder. The upper nibble identifies the exhibit and the lower nibble sets playback volume. Connect that decoder to the public outputs and combine the visitor controls into one reliable play request. Edit `top_module.vhd`; `guide_receiver.vhd` is supplied support code.

## 1. Recognize the exhibit

Connect all four bits of the receiver's `stop_id` output to `recognized_stop`. Keep an explicit four-bit intermediate signal and use named port association so the connection is easy to trace.

## 2. Restore the volume range

Connect all four receiver volume bits to `speaker_volume`. Values 0 through 15 must remain distinct, including values whose upper bits are set.

## 3. Let the visitor start the guide

Drive `play_request` from one concurrent assignment. It is `'1'` exactly when both `listen_button` and `signal_present` are `'1'`; otherwise it is `'0'`.
