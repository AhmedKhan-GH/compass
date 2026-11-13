### Start with a model

A **hardware model** is a text description of a circuit's connections and behavior. In Verilog, a **module** names a block of hardware. Its **ports** are the signals that cross the block's boundary.

### Give the output a value

```verilog
module beacon (
    output wire lamp
);
    assign lamp = 1'b0;
endmodule
```

`assign` describes a **continuous assignment**: the connection keeps driving its destination for as long as the model exists.
