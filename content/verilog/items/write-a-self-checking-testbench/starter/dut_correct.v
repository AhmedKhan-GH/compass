module selector (
    input wire [3:0] a,
    input wire [3:0] b,
    input wire select_b,
    output wire [3:0] y
);
    assign y = select_b ? b : a;
endmodule
