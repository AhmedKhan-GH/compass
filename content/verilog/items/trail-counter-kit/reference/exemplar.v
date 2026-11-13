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
    trail_counter #(
        .WIDTH(WIDTH)
    ) counter (
        .clk(clk),
        .reset(reset),
        .arrival(arrival),
        .visitors(visitors)
    );

    trail_indicator #(
        .WIDTH(WIDTH),
        .WARNING_AT(WARNING_AT)
    ) indicator (
        .visitors(visitors),
        .busy(busy)
    );
endmodule
