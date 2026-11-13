module top_module (
    input wire [7:0] samples,
    output reg [7:0] inverted,
    output reg [3:0] ones
);
    integer i;
    always @* begin
        inverted = 0;
        ones = 0;
    end
endmodule
