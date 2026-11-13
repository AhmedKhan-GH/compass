A testbench may need a **producer** to send data, a **consumer** to receive it, and a **watchdog** to stop the test if it takes too long. These workers can run separately. Verilog-2005 can run them concurrently in a named fork block:

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

The branches begin together. `disable workers` stops unfinished work in the named group and execution resumes after join. The successful completion path must also stop the watchdog, or it could later report a false failure.

Let only one worker drive each input signal, and keep the expected output sequence separately. Drive on falling edges while the DUT samples on rising edges to avoid races.

You will use these workers to check a queue at the repair bench.
