module top_module (
    input wire [7:0] old_status,
    input wire [7:0] select,
    input wire [7:0] updates,
    output wire [7:0] shown,
    output wire [7:0] merged
);
    assign shown = 0;
    assign merged = 0;
endmodule
