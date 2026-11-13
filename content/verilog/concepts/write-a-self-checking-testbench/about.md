A **testbench** drives a circuit and checks its behavior. The circuit under test is often called the DUT. Use `reg` variables for inputs you change from testbench blocks, and wires for the outputs you observe. An `initial` block runs its sequence once.

```verilog
initial begin
    stimulus = 1'b0;
    #1;
    if (observed !== 1'b0) begin
        errors = errors + 1;
        $display("expected 0, observed %b", observed);
    end
    $finish;
end
```

Initialize the integer error count before comparisons. The small delay allows combinational logic to settle. Here, `!==` counts x and z as failures, along with the wrong binary value. Simulation delays and display calls belong to the checker, not synthesizable circuit logic.

Print one final result: `CHECK_PASS` if every comparison passed, or `CHECK_FAIL` if any failed. Then end the simulation. Nebula runs your checker against a correct component and several faulty versions.
