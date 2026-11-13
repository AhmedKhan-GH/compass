A **vector** is several bits carried together. `wire [3:0] code;` has four positions, numbered 3 down to 0. The number of bits is one greater than the difference between the endpoints.

A sized literal such as `3'b101` gives a width, base, and pattern. Bits that do not fit a destination are discarded, so choose the width deliberately.

In the following example, tag has two bits and payload has four. These snippets assemble and inspect their separate six-bit message:

```verilog
wire [5:0] message;
assign message = {tag, payload};
assign first = message[5];
assign field = message[4:2];
assign recognized = (field == 3'b011);
```

Braces **concatenate** signals from left to right without arithmetic. A bit select reads one position. A part select reads a range, including both endpoints. Equality `==` produces one bit indicating whether whole patterns match. A single `=` assigns a result.
