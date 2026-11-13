module top_module (
    input wire signed [7:0] sample_a,
    input wire signed [7:0] sample_b,
    input wire signed [7:0] sample_c,
    output wire signed [7:0] clamped_a,
    output wire signed [7:0] clamped_b,
    output wire signed [7:0] clamped_c
);
    function signed [7:0] clamp;
        input signed [7:0] value;
        begin
            if (value < 8'd40) clamp = -8'sd40;
            else if (value > 8'd60) clamp = 8'sd60;
            else clamp = value;
        end
    endfunction
    assign clamped_a = clamp(sample_a);
    assign clamped_b = clamp(sample_a);
    assign clamped_c = clamp(sample_c);
endmodule
