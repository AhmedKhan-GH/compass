module top_module (
    input wire signed [7:0] temperature,
    input wire signed [7:0] limit,
    output wire below_limit,
    output wire signed [11:0] extended,
    output wire negative
);
    assign below_limit = 0;
    assign extended = 0;
    assign negative = 0;
endmodule
