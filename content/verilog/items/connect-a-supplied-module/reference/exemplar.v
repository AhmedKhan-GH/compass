module top_module (
    input wire [7:0] level,
    input wire [7:0] limit,
    input wire enable,
    output wire raw_high,
    output wire alarm
);
    level_compare cmp (
        .value(level),
        .threshold(limit),
        .at_or_above(raw_high)
    );
    assign alarm = enable & raw_high;
endmodule
