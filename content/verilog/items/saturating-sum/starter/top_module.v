module top_module (
    input wire [7:0] a,
    input wire [7:0] b,
    output wire [7:0] result,
    output wire saturated
);
    wire [8:0] total = {1'b0, a} + {1'b0, b};
    assign saturated = 0;
    assign result = 0;
endmodule
