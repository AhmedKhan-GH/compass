module top_module (
    input wire clk,
    input wire reset,
    input wire button,
    output reg rise
);
    reg previous;
    always @(posedge clk) begin
        if (reset) begin
            previous <= 0;
            rise <= 0;
        end else begin
            previous <= 0;
            rise <= 0;
        end
    end
endmodule
