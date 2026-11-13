module top_module #(
    parameter LANES = 4
) (
    input wire [LANES*8-1:0] data,
    input wire [LANES-1:0] received_parity,
    output wire [LANES-1:0] error
);
    assign error = {LANES{1'b0}};
endmodule
