module top_module (
    input wire request,
    input wire blocked,
    output reg fan_on,
    output reg fault
);
    // Reported fault: an output can survive after the request has ended.
    always @* begin
        if (request && !blocked) begin
            fan_on = 1'b1;
            fault = 1'b0;
        end else if (request && blocked) begin
            fan_on = 1'b0;
            fault = 1'b1;
        end
    end
endmodule
