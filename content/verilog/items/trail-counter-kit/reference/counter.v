`include "trail_defs.vh"

module trail_counter #(
    parameter WIDTH = `TRAIL_COUNT_WIDTH
) (
    input wire clk,
    input wire reset,
    input wire arrival,
    output reg [WIDTH-1:0] visitors
);
    always @(posedge clk) begin
        if (reset) visitors <= 0;
        else if (arrival) visitors <= visitors + 1'b1;
    end
endmodule
