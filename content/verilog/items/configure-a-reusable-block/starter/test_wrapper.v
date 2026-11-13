module test_wrapper (
    input wire [7:0] data8,
    input wire clear8,
    input wire [2:0] data3,
    input wire clear3,
    output wire [7:0] shown8,
    output wire nz8,
    output wire [2:0] shown3,
    output wire nz3
);
    configurable_block #(
        .WIDTH(8),
        .RESET_VALUE(8'hA5)
    ) w (
        .data(data8),
        .clear(clear8),
        .shown(shown8),
        .nonzero(nz8)
    );
    configurable_block #(
        .WIDTH(3),
        .RESET_VALUE(3'b101)
    ) n (
        .data(data3),
        .clear(clear3),
        .shown(shown3),
        .nonzero(nz3)
    );
endmodule
