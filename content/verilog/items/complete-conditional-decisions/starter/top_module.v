module top_module (
    input wire request,
    input wire blocked,
    input wire boost,
    output reg fan_on,
    output reg [1:0] speed
);
    always @* begin
        fan_on = 0;
        speed = 0;
    end
endmodule
