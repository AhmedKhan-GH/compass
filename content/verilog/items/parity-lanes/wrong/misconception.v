module top_module #(
    parameter LANES = 4
) (
    input wire [LANES*8-1:0] data,
    input wire [LANES-1:0] received_parity,
    output wire [LANES-1:0] error
);
    genvar i;
    generate
        for (i = 0; i < LANES; i = i + 1) begin : lane
            parity8 p (
                .data  (data[i*8+:8]),
                .parity(received_parity[LANES-1-i]),
                .error (error[i])
            );
        end
    endgenerate
endmodule
