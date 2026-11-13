module top_module (
    input wire request,
    input wire blocked,
    output reg fan_on,
    output reg fault
);
    always @* begin
        fan_on = 0;
        fault = 0;
        if (request) begin
            if (blocked) fault = 1;
            else fan_on = 1;
        end
    end
endmodule
