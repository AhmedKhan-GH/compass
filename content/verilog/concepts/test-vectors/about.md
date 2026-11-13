A test-vector file separates cases from the code that drives them. `$readmemh` loads hexadecimal words into an unpacked array:

```verilog
reg [7:0] cases [0:3];
initial begin
    $readmemh("cases.hex", cases);
end
```

The first file word goes into the array’s first element. The file format must explain which entries are inputs and which are expected outputs. Choose the correct first entry, step size, and stopping point so every case runs once. Replaying the cases takes simulation time.
