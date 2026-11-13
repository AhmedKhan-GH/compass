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
        begin
            count_ones = 0;
        end
    endfunction
    assign count_a = 0;
    assign count_b = 0;
    assign count_c = 0;
endmodule
