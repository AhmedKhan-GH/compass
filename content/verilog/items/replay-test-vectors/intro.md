A test-vector file separates cases from the code that drives them. `$readmemh` loads hexadecimal words into an unpacked array:

```verilog
reg [7:0] cases [0:3];
initial begin
    $readmemh("cases.hex", cases);
end
```

The first file word goes into the array’s first element. The file format must explain which entries are inputs and which are expected outputs. Choose where to start, how many entries make up one case, and where to stop. Replaying those cases through the circuit takes simulation time.

You will read and replay the log supplied with the returned weather-station board.
