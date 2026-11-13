module top_module (
    input wire [3:0] channel_a,
    input wire [3:0] channel_b,
    input wire select_b,
    input wire [1:0] channel,
    input wire override_active,
    input wire [3:0] override_data,
    output wire [3:0] selected,
    output wire [3:0] decoded,
    output wire [3:0] priority_selected
);
    assign selected = select_b ? channel_a : channel_b;
    assign decoded = (channel == 2'b00) ? channel_a :
                     (channel == 2'b01) ? channel_b : 4'b0000;
    assign priority_selected = override_active ? override_data : decoded;
endmodule
