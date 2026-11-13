The greenhouse needs a selector checkout that can be repeated and gives a clear result. A **testbench** drives a circuit, checks its outputs, and reports whether they match the requirements. The circuit being checked is often called the **DUT**, short for design under test.

Inputs driven by the testbench are `reg` variables. DUT outputs observed by the testbench connect to wires. An `initial` block runs a sequence once, for example:

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

Set the integer error count to zero before checking anything. The short delay lets the combinational output settle. Case inequality (`!==`) catches `x` and `z` as well as incorrect binary values.

Delays and display calls belong to the testbench, not the circuit you would build. End the checker with exactly one verdict: `CHECK_PASS` when there are no mismatches, or `CHECK_FAIL` otherwise, then finish. Nebula runs the same checker against a correct component and several faulty ones.
