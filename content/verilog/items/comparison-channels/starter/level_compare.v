module level_compare (
    input wire [7:0] value,
    input wire [7:0] threshold,
    output wire at_or_above
);
    assign at_or_above = value >= threshold;
endmodule
