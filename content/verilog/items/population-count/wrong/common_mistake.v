module top_module (
    input wire [11:0] lamps,
    input wire [3:0] limit,
    output reg [3:0] count,
    output reg over_limit
);
    integer i;
    always @* begin
        count = 0;
        for (i = 0; i < 11; i = i + 1) count = count + lamps[i];
        over_limit = (count > limit);
    end
endmodule
