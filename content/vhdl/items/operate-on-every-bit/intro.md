Logic operators apply position by position to vectors. A VHDL-2008 aggregate such as `(status'range => mask(0))` repeats one bit across the vector. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

Vector logic applies the same operation independently at each position. An aggregate can repeat one bit across a target range:

```vhdl
inverted_word <= not input_word;
masked_word <= input_word and enable_mask;
toggled_word <= input_word xor (input_word'range => toggle);
```

The `'range` attribute follows the bounds of `input_word`, avoiding a hard-coded width. All operands of a vector logic operation must have compatible bounds.
