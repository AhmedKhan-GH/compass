module top_module (
    input wire clk,
    input wire reset,
    input wire flush,
    input wire in_valid,
    output wire in_ready,
    input wire [7:0] in_data,
    output wire out_valid,
    input wire out_ready,
    output wire [7:0] out_data
);
    // Design the stored state and transfer decisions for the specified behavior.
    assign in_ready = 1'b0;
    assign out_valid = 1'b0;
    assign out_data = 8'h00;
endmodule
