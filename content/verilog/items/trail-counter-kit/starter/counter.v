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
        // Record one arrival per active clock edge; reset starts a new count.
        visitors <= 0;
    end
endmodule
