module top_module (
    input wire [7:0] panel,
    output wire mirrored
);
    assign mirrored = (panel[7] == panel[0]);
endmodule
