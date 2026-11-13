module top_module (
    input wire [7:0] data,
    input wire received_parity,
    output wire generated_parity,
    output wire error
);
    assign generated_parity = 0;
    assign error = 0;
endmodule
