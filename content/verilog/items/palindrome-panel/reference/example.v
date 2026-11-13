module top_module (
    input wire [7:0] panel,
    output wire mirrored
);
    assign mirrored = (panel[7:4] == {panel[0], panel[1], panel[2], panel[3]});
endmodule
