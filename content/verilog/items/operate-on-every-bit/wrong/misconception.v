module top_module (
    input wire [7:0] status,
    input wire [7:0] mask,
    output wire [7:0] inverted,
    output wire [7:0] kept,
    output wire [7:0] toggled
);
    assign inverted = ~status;
    assign kept = status | mask;
    assign toggled = status ^ {8{mask[0]}};
endmodule
