A Verilog task is a reusable procedure, but separate calls do not always have separate storage.

Ordinary Verilog tasks have **static lifetime**: overlapping calls share the task's arguments and local variables. If one call waits while another begins, the second call can overwrite values that the first still needs.

An `automatic` task gives each call its own arguments and local variables:

```verilog
task automatic log_after;
    input integer delay_ticks;
    input integer reading;
    begin
        #(delay_ticks);
        $display("reading = %0d", reading);
    end
endtask
```

This is useful for simulation workers that overlap in time. It does not create additional hardware, and it does not make module-level variables private. You must still decide which call is allowed to write each shared output.

A `fork`/`join` block starts its statements concurrently and waits for them all to finish. The fixture in this exercise uses it to overlap calls while assigning each call a different lamp.
