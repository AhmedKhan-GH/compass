module top_module (
    input wire [7:0] old_status,
    input wire [7:0] select,
    input wire [7:0] updates,
    output wire [7:0] shown,
    output wire [7:0] merged
);
    assign shown = old_status & select;
    assign merged = (old_status & select) | (updates & select);
endmodule
