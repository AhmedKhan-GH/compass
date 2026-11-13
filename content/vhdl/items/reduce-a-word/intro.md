VHDL-2008 reduction operators `or`, `and`, and `xor` collapse a vector to one bit. Comparing the full vector with zero gives a separate presence test. Because this is combinational hardware, the result is recalculated whenever a referenced input changes and no clock is needed. Each output must have a defined value for every input combination.

VHDL-2008 reduction operators collapse all positions of a vector to one `std_logic` result:

```vhdl
any_busy <= or busy_bits;
all_ready <= and ready_bits;
parity <= xor message;
```

`or` detects at least one set bit, `and` requires every bit, and `xor` is set for an odd number of ones. These prefix forms are distinct from two-operand vector expressions.
