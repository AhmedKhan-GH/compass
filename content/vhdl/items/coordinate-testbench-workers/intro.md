Every process in a VHDL architecture runs concurrently. A testbench gives separate jobs to a producer, consumer, and watchdog by declaring three labeled processes:

```vhdl
producer : process
begin
    request <= '1';
    wait until rising_edge(clk);
    request <= '0';
    producer_done <= '1';
    wait;
end process;

watchdog : process
begin
    wait for 200 ns;
    assert test_done = '1' report "CHECK_FAIL timeout" severity failure;
    wait;
end process;
```

The processes start together and advance independently at their `wait` statements. A final unconditional `wait` prevents a worker from repeating. Give each driven input one owner: the producer drives `push`, while the consumer drives `pop`. Completion signals coordinate workers without creating multiple drivers.

The consumer owns normal completion because only it knows every expected result was checked. A watchdog remains a separate bounded failure path and must stay silent after `test_done`, preventing a late second verdict.

A `wait until` suspends even if its condition is already true. Check a level first when a worker may arrive late:

```vhdl
if ready /= '1' then
    wait until ready = '1';
end if;
```
