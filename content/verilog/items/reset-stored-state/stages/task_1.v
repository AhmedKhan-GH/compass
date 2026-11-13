module top_module (
    input wire clk,
    input wire sync_reset,
    input wire async_reset,
    input wire [3:0] data,
    output reg [3:0] sync_value,
    output reg [3:0] async_value
);
    always @(posedge clk) begin
        if (sync_reset) sync_value <= 0;
        else sync_value <= data;
    end
    always @(posedge clk or posedge async_reset) async_value <= 0;
endmodule
