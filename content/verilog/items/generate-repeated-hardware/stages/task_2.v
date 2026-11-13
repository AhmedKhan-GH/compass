module top_module #(
    parameter LANES = 4
) (
    input wire [LANES-1:0] request,
    input wire [LANES-1:0] inhibit,
    output wire [LANES-1:0] grant,
    output wire any_grant
);
    genvar i;
    generate
        for (i = 0; i < LANES; i = i + 1) begin : lanes
            assign grant[i] = request[i] & ~inhibit[i];
        end
    endgenerate
    generate
        if (LANES == 1) begin : one
            assign any_grant = grant[0];
        end else begin : many
            assign any_grant = |grant;
        end
    endgenerate
endmodule
