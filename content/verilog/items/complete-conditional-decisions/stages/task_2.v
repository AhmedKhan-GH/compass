module top_module (
    input wire request,
    input wire blocked,
    input wire boost,
    output reg fan_on,
    output reg [1:0] speed
);
    always @* begin
        fan_on = 1'b0;
        speed = 2'b00;
        if (request && !blocked) begin
            fan_on = 1'b1;
            if (boost) speed = 2'b10;
            else speed = 2'b01;
        end
    end
endmodule
