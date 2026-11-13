module top_module (
    input wire critical,
    input wire warning,
    input wire advisory,
    output wire [1:0] code,
    output wire valid
);
    assign code = critical ? 2'b11 : warning ? 2'b10 : advisory ? 2'b01 : 2'b01;
    assign valid = critical | warning | advisory;
endmodule
