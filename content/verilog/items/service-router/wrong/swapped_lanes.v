module top_module (
    input wire [3:0] data,
    input wire [1:0] destination,
    input wire enabled,
    output wire [3:0] lane_0,
    output wire [3:0] lane_1,
    output wire [3:0] lane_2
);
    assign lane_0 = (enabled & (destination == 2'b00)) ? data : 4'b0000;
    assign lane_1 = (enabled & (destination == 2'b10)) ? data : 4'b0000;
    assign lane_2 = (enabled & (destination == 2'b01)) ? data : 4'b0000;
endmodule
