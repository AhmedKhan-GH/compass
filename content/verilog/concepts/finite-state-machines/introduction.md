A finite-state machine remembers which situation a controller is in. Use named `localparam` constants so you can refer to states by name instead of remembering their binary codes.

```verilog
localparam WAITING = 2'd0;
localparam WORKING = 2'd1;
reg [1:0] state;
reg [1:0] next_state;
```

Ask three questions: which state are we in, which state comes next, and what should the outputs do in this state? Combinational logic can choose `next_state`; a rising-edge register stores it. A Moore output depends only on the stored state, so input changes between edges do not immediately change it.

Alongside the main transitions, show when the state stays the same, what reset does, and what happens if the state register contains an unused code.
