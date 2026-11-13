The testbench creates a clock with a delayed concurrent assignment, uses `wait until rising_edge(clk)` for sampling, and also checks between edges to reject a live combinational substitute. Testbench timing statements control simulation rather than synthesizable hardware. Reports provide useful diagnostics, but the final verdict marker is the contract used by the automated grader to classify each DUT.

A testbench clock can be generated with a delayed concurrent assignment, and checks can synchronize to a particular edge:

```vhdl
signal clk : std_logic := '0';

clk <= not clk after 5 ns;

process
begin
    data <= x"3C";
    wait until rising_edge(clk);
    wait for 1 ns;
    assert q = x"3C" report "capture failed" severity error;
    wait;
end process;
```

Initialize the clock so inversion has a definite starting value. The short delay after the edge allows scheduled register updates to settle before comparison; separate between-edge checks expose transparent or wrong-edge implementations.
