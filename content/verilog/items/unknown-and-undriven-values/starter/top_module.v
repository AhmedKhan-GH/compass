module top_module (
    input wire source,
    input wire left,
    input wire right,
    output wire connected,
    output wire same,
    output wire conflict_free
);
    // Task 1: find the missing connection to this output.

    // Task 2: add the comparison for the two definite test inputs.
    assign same = 1'b0;

    // Task 3: inspect the drivers of the second lamp connection.
    assign conflict_free = source;
    assign conflict_free = 1'b0;
endmodule
