With the exhibit's power indicator working, the museum staff are adding a lightbox that visitors can control themselves. A switch beside it should let someone turn the light on to look at the display and off again when they are done. You will build the connection that makes the lightbox respond to the visitor's current choice, moving from an output that stays fixed to one that can change.

The starter carries forward the always-on output from First Light. Keep the name `top_module` and its output `out`. You will first extend its interface, then change its behavior. Use **Run tests** after each task.

## 1. Add the visitor's switch

The lightbox has an output, but your model has no way to hear from the visitor yet. Add a connection through which the switch's position can reach it.

Add a one-bit input port named `in` alongside the one-bit output `out`. The outside world supplies `1` while the switch is on and `0` while it is off. Keep the existing output behavior for now.

**Reason it through:** Who supplies the switch's value: your model, or something outside it? Which port direction expresses that relationship?

**Check your reasoning:** Run the tests. The interface task should pass, but the behavior task should still fail when the testbench turns the switch off.

## 2. Follow the visitor's switch

A visitor tries the switch and expects the light to respond each time. The constant output you started with cannot follow their choices. Change the model's behavior so the lightbox responds to the current switch position.

When `in` is `0`, `out` must be `0`; when `in` is `1`, `out` must be `1`. This must continue working after repeated changes, without storing an earlier position. The model reads the input and drives the output.

**Reason it through:** Predict the light's response when the switch goes on, off, then on again. Why would either fixed value from First Light fail?

**Check your reasoning:** Run the tests and compare the input and output in **Waveform**. In **Circuit**, look for the connection that lets a changing switch control the lightbox without a gate.
