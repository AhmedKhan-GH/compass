module top_module (
    input wire critical,
    input wire warning,
    input wire advisory,
    output wire [1:0] code,
    output wire valid
);
    assign code = advisory ? 2'b01 : warning ? 2'b10 : critical ? 2'b11 : 2'b00;
    assign valid = critical | warning | advisory;
endmodule
