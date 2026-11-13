Before a museum exhibit opens to visitors, the staff need a way to tell whether its control board is switched on. The exhibit may sit idle between visitors, so silence and stillness do not tell them enough. Your first job is to build a steady power indicator: the first working piece of the exhibit, giving staff a clear sign that the board is on even when nothing else is happening.

Start with the empty `module` in the editor. The Concepts below explain how to turn that shell into a model with a connection and behavior. Keep the name `top_module` so the tests can find it. Use **Run tests** after each task; you can pass the first while the second is still unfinished.

## 1. Give the model an output

The indicator needs a connection from the control board before it can show anything. First give your model that connection, so the testbench has a signal to observe.

Add a one-bit output port named `out` to `top_module`. This model needs no input yet. Leave its value undecided for this task.

**Reason it through:** The indicator receives a signal from your model. From the model's point of view, should that connection point in or out?

**Check your reasoning:** Run the tests. The first task should pass once the named one-bit output is present. The second task should still fail: declaring a connection has not given it the required value.

## 2. Light the indicator

The staff switch on the exhibit before connecting its controls. They need the indicator to stay lit even when nobody is using the exhibit. Give the output the behavior that makes this useful.

The output `out` controls the indicator: `1` means lit and `0` means off. It must always be `1`, starting as soon as the simulation settles. Keep the output port you added in the first task.

**Reason it through:** Does a steady power indication need a changing input, or can the model supply one fixed value?

**Check your reasoning:** Run the tests, then inspect **Schematic** and **Waveforms**. Find what drives `out` and check that it stays high. A correct model here needs a constant connection, without a Boolean gate.
