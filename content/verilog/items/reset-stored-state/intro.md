The lighting desk has two ways to clear a dimmer. A **synchronous reset** is checked at the same clock edge as normal data. An **asynchronous reset** can clear the stored value when reset rises, without waiting for a clock edge.

```verilog
always @(posedge clock or posedge clear_now) begin
    if (clear_now) begin
        stored <= 4'd0;
    end else begin
        stored <= incoming;
    end
end
```

The example responds to either a rising clock edge or a rising `clear_now` signal. If reset is high, it clears the register; otherwise, a clock edge loads the input. Removing the reset edge from the event list gives the synchronous version.

Lowering reset alone does not load data. The next input value is still captured at a rising clock edge.
