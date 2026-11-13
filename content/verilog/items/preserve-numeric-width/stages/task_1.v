module top_module (
    input wire [7:0] a,
    input wire [7:0] b,
    output wire [8:0] full_sum,
    output wire [7:0] wrapped,
    output wire carry
);
    assign full_sum = {1'b0, a} + {1'b0, b};
    assign wrapped = 0;
    assign carry = 0;
endmodule
