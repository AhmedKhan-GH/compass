A testbench may need to send data, check received data, and watch for a timeout at the same time. These jobs are often called the producer, consumer, and watchdog. Verilog-2005 can start them together in a named `fork` block:

```verilog
fork : workers
    begin
        // Producer actions.
    end
    begin
        // Consumer actions.
    end
    begin
        #100;
        $display("CHECK_FAIL timeout");
        disable workers;
    end
join
$finish;
```

The branches begin together. `disable workers` stops unfinished work in the named group and execution resumes after join. When all checks pass, stop the watchdog too, so it cannot report a timeout afterward.

Let only one process change each input signal. Keep a separate record of the values you expect to receive. If the circuit samples on rising edges, change its inputs on falling edges so the two actions cannot clash.
