A simulator can know that a bit is 0 or 1, know that it is undriven (`z`), or have insufficient information (`x`). These are **simulation values**. An `x` is not an extra voltage that a real circuit can recognize, and `z` on an input does not guarantee that a physical gate will interpret it safely.

Different Verilog decisions treat that uncertainty differently. A one-bit `if` condition takes its true branch only for 1. A condition of 0, `x`, or `z` takes the other branch. For example:

```verilog
always @* begin
    log_event = 1'b0;
    if (event_seen) begin
        log_event = 1'b1;
    end
end
```

This defines what the simulator reports; it does not prove that an uncertain electrical signal is safe. The fact that the result looks definite can even hide incomplete initialization in a model.

The conditional operator behaves differently when its one-bit select input is `x` or `z`. It compares the two candidate values **bit by bit**: matching bits survive and disagreeing bits become `x`. For example, selecting uncertainly between `4'b1100` and `4'b1001` yields `4'b1x0x`.

Ordinary equality (`==`) can also return `x`. In diagnostic code, **case equality** (`===`) compares all four states exactly and always returns 0 or 1. Thus two identical patterns containing `x` compare equal with `===`; replacing an `x` by 0 changes that answer. `!==` is its exact-state inequality counterpart.

Use Waveforms to inspect these cases directly. A synthesized circuit diagram helps with the known-value hardware, but cannot answer these four-state simulation questions.
