`include "trail_defs.vh"

module top_module #(
    parameter WIDTH = `TRAIL_COUNT_WIDTH,
    parameter WARNING_AT = 6
) (
    input wire clk,
    input wire reset,
    input wire arrival,
    output wire [WIDTH-1:0] visitors,
    output wire busy
);
    // Connect the two supplied modules after their individual tests pass.
    assign visitors = 0;
    assign busy = 0;
endmodule
