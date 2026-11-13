module top_module #(
    parameter WIDTH = 8,
    DEPTH = 5,
    ADDR_WIDTH = 3
) (
    input wire clk,
    input wire reset,
    input wire in_valid,
    output wire in_ready,
    input wire [WIDTH-1:0] in_data,
    output wire out_valid,
    input wire out_ready,
    output wire [WIDTH-1:0] out_data
);
    // Choose the internal state needed to meet the behavior in the instructions.
    assign in_ready = 1'b0;
    assign out_valid = 1'b0;
    assign out_data = {WIDTH{1'b0}};
endmodule
