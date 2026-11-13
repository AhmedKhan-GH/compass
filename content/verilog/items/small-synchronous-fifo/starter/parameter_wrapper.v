module fifo_matrix (
    input wire clk,
    input wire reset,
    input wire v1,
    input wire r1,
    input wire [7:0] d1,
    output wire ir1,
    output wire ov1,
    output wire [7:0] q1,
    input wire v3,
    input wire r3,
    input wire [7:0] d3,
    output wire ir3,
    output wire ov3,
    output wire [7:0] q3,
    input wire v5,
    input wire r5,
    input wire [7:0] d5,
    output wire ir5,
    output wire ov5,
    output wire [7:0] q5
);
    top_module #(
        .WIDTH(8),
        .DEPTH(1),
        .ADDR_WIDTH(1)
    ) f1 (
        clk,
        reset,
        v1,
        ir1,
        d1,
        ov1,
        r1,
        q1
    );
    top_module #(
        .WIDTH(8),
        .DEPTH(3),
        .ADDR_WIDTH(2)
    ) f3 (
        clk,
        reset,
        v3,
        ir3,
        d3,
        ov3,
        r3,
        q3
    );
    top_module #(
        .WIDTH(8),
        .DEPTH(5),
        .ADDR_WIDTH(3)
    ) f5 (
        clk,
        reset,
        v5,
        ir5,
        d5,
        ov5,
        r5,
        q5
    );
endmodule
