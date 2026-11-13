A VHDL procedure names testbench actions that need identical timing on every call. A procedure inside a process can access that process's variables and the architecture's signals; parameters carry the value that differs:

```vhdl
procedure check_byte(expected : std_logic_vector(7 downto 0)) is
begin
    wait until falling_edge(clk);
    data <= expected;
    enable <= '1';
    wait until rising_edge(clk);
    wait for 1 ns;
    if output /= expected then
        errors := errors + 1;
    end if;
end procedure;
```

The waits make this simulation code. Falling-edge stimulus stays away from the DUT's rising sampling edge, and the short post-edge delay lets scheduled updates settle. A process variable uses `:=`, so one mismatch count can collect results from every call.

Diagnostics describe individual mismatches without printing verdict markers. After all load, hold, and reset checks, the process emits exactly one `CHECK_PASS` or `CHECK_FAIL`, then calls `finish`.
