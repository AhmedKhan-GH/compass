A VHDL procedure packages timed testbench actions. A formal parameter of class `signal` associates with the caller's signal, while an ordinary `time` parameter carries a duration:

```vhdl
procedure illuminate(
    signal lamp : inout std_logic;
    duration : time
) is
    variable started_at : time := now;
begin
    lamp <= '1';
    wait for duration;
    assert now - started_at = duration report "wrong duration" severity error;
    lamp <= '0';
end procedure;
```

Parameters and variables declared inside a VHDL subprogram belong to that invocation. If separate processes call it at overlapping times, each suspended call retains its own lamp association, duration, and start time. The procedure does not create concurrency; the caller processes do.

Assigning one indexed signal element changes only that lamp. Giving each worker a different element avoids multiple drivers. A checker process can observe combined overlap patterns, wait for all workers, print one verdict, and finish.
