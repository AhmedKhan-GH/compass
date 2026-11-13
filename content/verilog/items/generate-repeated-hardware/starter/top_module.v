module top_module #(
    parameter LANES = 4
) (
    input wire [LANES-1:0] request,
    input wire [LANES-1:0] inhibit,
    output wire [LANES-1:0] grant,
    output wire any_grant
);
    assign grant = 0;
    assign any_grant = 0;
endmodule
