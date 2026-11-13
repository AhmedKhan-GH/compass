Before a museum hands out its new audio guides, tests reveal that the handsets lose exhibit numbers and limit the volume even though the supplied receiver finds the right information. Trace the wiring around that receiver and repair its connections, including the unreliable play request, so each handset can deliver the exhibit information and respond to its visitor's listen button.

`guide_receiver.v` is the supplied receiver: the upper four bits of `beacon` identify the exhibit, and the lower four bits specify its volume. It is already correct. Repair the connections in `top_module.v`; keep the supplied receiver instance and the public ports.

## 1. Recognize the exhibit

A visitor points the handset at an exhibit, but the simulation does not show the exhibit number from the receiver. Repair that connection so the handset can identify which guide recording belongs to the exhibit.

`recognized_stop` must carry all four bits of the receiver's `stop_id` output. Exhibit numbers range from 0 through 15. The starter compiles, yet the declared stop wire does not receive the receiver's output.

**Reason it through:** Trace the name at each end of this connection. What would you see on a wire that was declared but never driven?

**Check your reasoning:** Run tests and inspect `beacon` and `recognized_stop` in Waveforms. A beacon of `8'hA5` identifies stop 10, not stop 0 or 1.

## 2. Restore the volume range

The handset now needs the full volume setting sent by the exhibit beacon. Restore the connection that loses the upper volume bits, then enable a compiler check that catches undeclared wires.

`speaker_volume` must carry all four bits of the receiver's `volume` output, including values above 1. Declare the connection explicitly with the width it needs. Once every connection is declared correctly, enable `default_nettype none` for this module and restore `default_nettype wire` afterward.

**Reason it through:** Why could a connection with the correct spelling still deliver only 0 or 1? Compare the receiver port's width with the intervening wire.

**Check your reasoning:** Keep the stop number fixed and vary the volume from 0 through 15. In particular, volumes 2 and 3 must remain different.

## 3. Let the visitor start the guide

The visitor should be able to start a recording when a beacon is available. Repair the play-request wiring so it reflects both the listen button and the presence of that signal.

`play_request` must be 1 exactly when the visitor presses `listen_button` and a receiver signal is present (`signal_present` is 1). Otherwise it is 0. Give this wire one intended driver; remove the conflicting starter assignments.

**Reason it through:** What should happen if the button is pressed between exhibits? Why would adding the desired driver alongside a constant-zero driver produce an unknown value?

**Check your reasoning:** Try every button/signal combination, then change the beacon while playback is requested. Stop number, volume, and request must all continue to follow their own inputs.
