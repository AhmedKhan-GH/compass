The greenhouse needs the same calculation at each probe position. A **bounded loop** can describe that repeated work inside a combinational procedure. Its limit is fixed here; one loop iteration does not take one clock cycle.

```verilog
integer index;
always @* begin
    reversed = 4'b0000;
    for (index = 0; index < 4; index = index + 1) begin
        reversed[index] = incoming[3-index];
    end
end
```

In Verilog-2005, declare the integer index outside the loop. Blocking assignments make each intermediate result available to the following iteration.

If the loop adds up a total, start that total from a known value every time the procedure runs. Otherwise a new set of readings could incorrectly include the old total.
