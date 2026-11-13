module sample_register (
    input wire clk,
    input wire reset,
    input wire [7:0] data,
    output wire [7:0] q
);
    assign q = reset ? 0 : data;
endmodule
