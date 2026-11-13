The camera dial sends a code that the controller must recognize. A `case` statement lets you list the result for each code. It is useful when you are choosing between specific values.

```verilog
always @* begin
    case (setting)
        2'b00: tone = 3'd1;
        2'b01: tone = 3'd4;
        default: tone = 3'd0;
    endcase
end
```

The `default` branch handles every code you did not list. Use `begin` and `end` when a branch needs several statements. Every output still needs a value on every possible path.
