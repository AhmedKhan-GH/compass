module top_module (
    input wire [7:0] channel_a,
    input wire [7:0] channel_b,
    input wire [7:0] channel_c,
    output wire [3:0] count_a,
    output wire [3:0] count_b,
    output wire [3:0] count_c
);
    function [3:0] count_ones;
        input [7:0] value;
        integer i;
        begin
            count_ones = 0;
            for (i = 0; i < 8; i = i + 1) count_ones = count_ones + value[i];
        end
    endfunction
    assign count_a = count_ones(channel_a);
    assign count_b = count_ones(channel_b);
    assign count_c = count_ones(channel_c);
endmodule
