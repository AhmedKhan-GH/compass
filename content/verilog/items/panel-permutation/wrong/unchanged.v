module top_module (
    input wire [7:0] status,
    output wire [7:0] lamps
);
    assign lamps = status;
endmodule
