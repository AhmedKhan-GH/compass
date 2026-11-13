A conditional signal assignment reads from left to right and needs a final alternative. It expresses two-way selection, decoded selection, and a highest-priority override without stored state. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

A conditional signal assignment tests choices in order and always ends with a final alternative:

```vhdl
display <= service_data when service = '1' else
           sensor_b when choose_b = '1' else
           sensor_a;
```

Only the first true condition wins. Supplying the unconditional final expression makes the hardware fully combinational for every input combination.
