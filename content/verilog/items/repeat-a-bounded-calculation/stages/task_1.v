module top_module (
    input wire [7:0] samples,
    output reg [7:0] inverted,
    output reg [3:0] ones
);
    integer i;
    always @* begin
        inverted = 0;
        ones = 0;
        for (i = 0; i < 8; i = i + 1) inverted[i] = ~samples[i];
    end
endmodule
