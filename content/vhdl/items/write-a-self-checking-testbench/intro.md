The portless testbench instantiates `selector`, drives signals from a process, waits for propagation, counts mismatches, reports one verdict, and calls `finish`. Testbench timing statements control simulation rather than synthesizable hardware. Reports provide useful diagnostics, but the final verdict marker is the contract used by the automated grader to classify each DUT.

A portless entity is the usual top level for a native VHDL testbench. A process drives stimulus, waits for propagation, checks a result, and ends the run:

```vhdl
entity testbench is
end entity;

architecture sim of testbench is
    signal input_word : std_logic_vector(3 downto 0);
    signal output_word : std_logic_vector(3 downto 0);
begin
    process
    begin
        input_word <= x"6";
        wait for 1 ns;
        assert output_word = x"6" report "mismatch" severity error;
        report "CHECK_PASS" severity note;
        finish;
        wait;
    end process;
end architecture;
```

The final `wait` makes the process syntactically non-repeating, while `finish` from `std.env` stops simulation. A real checker should count mismatches and emit exactly one pass or fail marker.
