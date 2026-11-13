module top_module (
    input wire [2:0] mode,
    output reg [3:0] lamps,
    output reg enabled
);
    always @* begin
        lamps = 0;
        enabled = 0;
    end
endmodule
