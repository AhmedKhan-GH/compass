module top_module (
    input wire source,
    input wire left,
    input wire right,
    output wire connected,
    output wire same,
    output wire conflict_free
);
    assign connected = source;
    assign same = (left == right);
    assign conflict_free = 1'b0;
endmodule
