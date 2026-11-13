A delayed signal assignment schedules a future output transaction rather than pausing the architecture. With transport delay, every input event is copied to the output later:

```vhdl
trace <= transport contact after 5 ns;
```

Inertial delay models hardware that cannot respond to a pulse below a threshold. A new input event can cancel a pending output transaction, and an explicit reject time states the minimum accepted input pulse width:

```vhdl
chime <= reject 3 ns inertial contact after 5 ns;
```

The reject time measures the input pulse; the `after` time schedules an accepted change on the output. Thus a two-nanosecond pulse reappears on `trace` five nanoseconds later but never becomes an event on `chime`. These timing assignments are useful simulation models and are not portable synthesizable delay logic.
