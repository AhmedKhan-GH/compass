module configurable_block #(
    parameter WIDTH = 8,
    parameter RESET_VALUE = 0
) (
    input wire [WIDTH-1:0] data,
    input wire clear,
    output wire [WIDTH-1:0] shown,
    output wire nonzero
);
    localparam [WIDTH-1:0] RESET_WORD = RESET_VALUE;
    assign shown = clear ? data : RESET_WORD;
    assign nonzero = |shown;
endmodule
