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
            clamp = value;
        end
    endfunction
    assign clamped_a = sample_a;
    assign clamped_b = sample_b;
    assign clamped_c = sample_c;
endmodule
