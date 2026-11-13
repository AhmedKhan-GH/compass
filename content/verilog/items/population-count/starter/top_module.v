module top_module (
    input wire [11:0] lamps,
    input wire [3:0] limit,
    output reg [3:0] count,
    output reg over_limit
);
    integer i;
    always @* begin
        count = 0;
        over_limit = 1'b0;
    end
endmodule
