The laundromat needs the same counting rule for three separate banks. A **function** gives a calculation a name so the same source code can be reused with different inputs.

```verilog
function [3:0] reverse_nibble;
    input [3:0] value;
    begin
        reverse_nibble = {value[0], value[1], value[2], value[3]};
    end
endfunction
```

Declare the input and result widths explicitly. In this Verilog syntax, assign the result to the function's own name. The result must be wide enough for every possible answer.

A function used in synthesizable logic cannot wait for a clock edge or take simulation time. Calling it for separate inputs describes the logic each use needs, not one processor handling the calls in order.
