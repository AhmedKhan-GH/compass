module top_module (
    input wire signed [7:0] temperature,
    output wire signed [11:0] displayed,
    output wire below_zero
);
    assign displayed = {4'b0000, temperature};
    assign below_zero = temperature < 0;
endmodule
