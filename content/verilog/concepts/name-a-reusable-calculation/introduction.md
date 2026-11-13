A Verilog function names a calculation that produces a value. A synthesizable function cannot wait for clock edges or consume simulation time. Calling it with independent inputs describes the logic needed for each use, not a shared processor executing calls in sequence.

```verilog
function [3:0] reverse_nibble;
    input [3:0] value;
    begin
        reverse_nibble = {value[0], value[1], value[2], value[3]};
    end
endfunction
```

Declare the result width and assign the answer to the function’s own name. Every path through the function must produce an answer, and the result must have enough bits to hold it.
