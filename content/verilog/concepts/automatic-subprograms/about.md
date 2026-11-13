# Darkroom timers

A photographic enlarger shines light through a negative to make a print. Keep each of the three lamps on its own timer, even when exposures overlap.

A Verilog task is a reusable procedure. Unlike a hardware module instance, a task declaration does not necessarily give each call its own storage.

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

This is useful for simulation workers that overlap in time. It does not create additional hardware, and it does not make module-level variables private. If calls write shared outputs, decide which call is allowed to change each output.

A `fork`/`join` block starts its statements concurrently and waits for them all to finish. The supplied test code uses it to start overlapping calls, each controlling a different lamp.
