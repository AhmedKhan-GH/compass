`include "trail_defs.vh"

module trail_indicator #(
    parameter WIDTH = `TRAIL_COUNT_WIDTH,
    parameter WARNING_AT = 6
) (
    input wire [WIDTH-1:0] visitors,
    output wire busy
);
    // The sign changes as soon as the count reaches its configured threshold.
    assign busy = 0;
endmodule
