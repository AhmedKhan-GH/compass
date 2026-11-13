module top_module (
    input wire [7:0] level_a,
    input wire [7:0] level_b,
    input wire [7:0] limit,
    output wire high_a,
    output wire high_b,
    output wire any_high
);
    level_compare a (
        .value(level_a),
        .threshold(limit),
        .at_or_above(high_a)
    );
    level_compare b (
        .value(level_b),
        .threshold(limit),
        .at_or_above(high_b)
    );
    assign any_high = high_a & high_b;
endmodule
