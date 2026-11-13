module sample_register (
    input wire clk,
    input wire reset,
    input wire [7:0] data,
    output reg [7:0] q
);
    always @(negedge clk)
        if (reset) q <= 0;
        else q <= data;
endmodule
