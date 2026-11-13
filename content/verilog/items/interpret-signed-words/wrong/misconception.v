module top_module (
    input wire signed [7:0] temperature,
    input wire signed [7:0] limit,
    output wire below_limit,
    output wire signed [11:0] extended,
    output wire negative
);
    assign below_limit = $unsigned(temperature) < $unsigned(limit);
    assign extended = {{4{temperature[7]}}, temperature};
    assign negative = temperature[7];
endmodule
