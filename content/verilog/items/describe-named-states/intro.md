A finite-state machine remembers which situation a controller is in. Named `localparam` values give each state a readable name.

```verilog
localparam WAITING = 2'd0;
localparam WORKING = 2'd1;
reg [1:0] state;
reg [1:0] next_state;
```

Separate three questions: what is the current state, which state should follow, and which outputs should be active? Combinational logic can choose next_state; a rising-edge register stores it. A Moore output depends only on the stored state, so input changes between edges do not immediately change it.

A state diagram needs hold behavior, reset behavior, and a decision for unused encodings as well as its main transitions.

You will use those states to describe a garden railway signal and its reset behavior.
