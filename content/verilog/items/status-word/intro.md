The service connection must carry several facts at once. A **vector** is several bits carried together. `wire [3:0] code;` has four positions, numbered 3 down to 0. The number of bits is one greater than the difference between the endpoints.

A literal such as `3'b101` specifies three bits, written in binary, with the pattern `101`. A destination that is too narrow loses the extra high bits.

In this example, `tag` has two bits and `payload` has four. The assignments join them into a six-bit message, then read parts of that message:

```verilog
wire [5:0] message;
assign message = {tag, payload};
assign first = message[5];
assign field = message[4:2];
assign recognized = (field == 3'b011);
```

Braces **concatenate** signals: they place the bits side by side, from left to right. A bit select reads one position. A part select reads a range, including both endpoints. Equality `==` gives a one-bit answer about whether the patterns match. A single `=` assigns a value.
