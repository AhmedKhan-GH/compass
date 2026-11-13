A `case` statement chooses a group of statements, called a branch, by matching a code. Use it when each code needs a different response.

```verilog
always @* begin
    case (setting)
        2'b00: tone = 3'd1;
        2'b01: tone = 3'd4;
        default: tone = 3'd0;
    endcase
end
```

The default handles every unlisted code. Use `begin` and `end` when a branch needs several statements. Every output must get a value for every possible input, including codes you did not list.
