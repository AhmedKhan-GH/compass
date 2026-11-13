module top_module (
    input wire [3:0] digit,
    output reg [6:0] segments,
    output reg valid
);
    always @* begin
        segments = 0;
        valid = 0;
    end
endmodule
