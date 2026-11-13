module top_module (
    input wire [7:0] a,
    input wire [7:0] b,
    output wire [7:0] sum,
    output wire [7:0] difference,
    output wire a_less_b,
    output wire equal
);
    assign sum = 0;
    assign difference = 0;
    assign a_less_b = 0;
    assign equal = 0;
endmodule
