module top_module (
    input wire [7:0] sample,
    input wire signed [7:0] signed_sample,
    output wire [7:0] doubled,
    output wire discarded,
    output wire signed [7:0] halved
);
    assign doubled = sample << 1;
    assign discarded = sample[7];
    assign halved = 0;
endmodule
