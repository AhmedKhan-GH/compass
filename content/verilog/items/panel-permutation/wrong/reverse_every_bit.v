module top_module (
    input wire [7:0] status,
    output wire [7:0] lamps
);
    assign lamps = {
        status[0],
        status[1],
        status[2],
        status[3],
        status[4],
        status[5],
        status[6],
        status[7]
    };
endmodule
