module configurable_block #(
    parameter WIDTH = 8,
    parameter RESET_VALUE = 0
) (
    input wire [WIDTH-1:0] data,
    input wire clear,
    output wire [WIDTH-1:0] shown,
    output wire nonzero
);
    assign shown = 0;
    assign nonzero = 0;
endmodule
