module top_module (
    input wire [7:0] status,
    output wire [7:0] lamps
);
    // Connect each lamp to its specified source bit.
    assign lamps = 8'b00000000;
endmodule
