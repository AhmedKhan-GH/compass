module top_module (
    input wire clk,
    input wire reset,
    input wire start,
    input wire [7:0] a,
    input wire [7:0] b,
    output reg busy,
    output reg done,
    output reg [15:0] product
);
    // Choose the internal state needed to meet the behavior in the instructions.
    always @(posedge clk) begin
        busy <= 1'b0;
        done <= 1'b0;
        product <= 16'h0000;
    end
endmodule
