module top_module (
    input wire clk,
    input wire sync_reset,
    input wire async_reset,
    input wire [3:0] data,
    output reg [3:0] sync_value,
    output reg [3:0] async_value
);
    always @(posedge clk) sync_value <= 4'h0;
    always @(posedge clk or posedge async_reset) async_value <= 4'h0;
endmodule
