module top_module (
    input wire [7:0] a,
    input wire [7:0] b,
    output wire [7:0] result,
    output wire saturated
);
    wire [8:0] total = {1'b0, a} + {1'b0, b};
    assign saturated = total >= 9'd255;
    assign result = saturated ? 8'hff : total[7:0];
endmodule
