module top_module (
    input wire signed [7:0] temperature,
    output wire signed [11:0] displayed,
    output wire below_zero
);
    // Reported fault: below-zero readings become positive on the wider display.
    assign displayed = {4'b0000, temperature};
    assign below_zero = displayed < 12'sd0;
endmodule
