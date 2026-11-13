module test_wrapper (
    input wire [7:0] a8,
    input wire [7:0] b8,
    input wire sel8,
    input wire blank8,
    input wire [2:0] a3,
    input wire [2:0] b3,
    input wire sel3,
    input wire blank3,
    output wire [7:0] out8,
    output wire [2:0] out3
);
    configurable_selector #(
        .WIDTH(8)
    ) w (
        .a(a8),
        .b(b8),
        .select(sel8),
        .blank(blank8),
        .data(out8)
    );
    configurable_selector #(
        .WIDTH(3)
    ) n (
        .a(a3),
        .b(b3),
        .select(sel3),
        .blank(blank3),
        .data(out3)
    );
endmodule
