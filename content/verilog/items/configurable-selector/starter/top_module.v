module configurable_selector #(
    parameter WIDTH = 8
) (
    input wire [WIDTH-1:0] a,
    input wire [WIDTH-1:0] b,
    input wire select,
    input wire blank,
    output wire [WIDTH-1:0] data
);
    assign data = 0;
endmodule
