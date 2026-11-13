module top_module (
    input wire [7:0] status,
    output wire [7:0] lamps
);
    assign lamps = {status[3:0], status[5:4], status[6], status[7]};
endmodule
