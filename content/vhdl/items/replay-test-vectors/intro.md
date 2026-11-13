VHDL's TextIO packages let a testbench read stimulus and expected results from a file instead of embedding every case in source code. A file object opens a named text file, and a `line` variable holds one line at a time:

```vhdl
file cases : text open read_mode is "cases.hex";
variable row : line;
variable stimulus : std_logic_vector(7 downto 0);

readline(cases, row);
hread(row, stimulus);
```

`readline` consumes one line. `hread` from `ieee.std_logic_textio` parses its hexadecimal text into a logic vector whose width comes from the destination variable. A loop guarded by `not endfile(cases)` consumes the file. If one case spans two lines, check that the expected line exists before reading it so a truncated pair fails clearly.

Reading a vector does not apply it to hardware. The testbench must drive the DUT away from its sampling edge, wait for the registered response to settle, and compare it with the independently read expected value. Variables count cases and mismatches with `:=`; the run then emits exactly one verdict and calls `finish`.
