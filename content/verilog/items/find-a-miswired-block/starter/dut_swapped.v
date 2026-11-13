module harness (
    input wire left,
    input wire right,
    input wire enable,
    output wire lamp_a,
    output wire lamp_b
);
    assign lamp_a = enable & right;
    assign lamp_b = enable & left;
endmodule
