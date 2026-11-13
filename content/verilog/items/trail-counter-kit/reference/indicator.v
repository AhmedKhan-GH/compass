`include "trail_defs.vh"

module trail_indicator #(
    parameter WIDTH = `TRAIL_COUNT_WIDTH,
    parameter WARNING_AT = 6
) (
    input wire [WIDTH-1:0] visitors,
    output wire busy
);
    assign busy = visitors >= WARNING_AT;
endmodule
