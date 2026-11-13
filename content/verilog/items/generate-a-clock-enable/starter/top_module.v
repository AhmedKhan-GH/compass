module top_module (
    input wire clk,
    input wire reset,
    output reg update,
    output reg [3:0] updates
);
    reg [1:0] divider;
    always @(posedge clk) begin
        if (reset) begin
            divider <= 0;
            update <= 0;
            updates <= 0;
        end else begin
            update <= 0;
        end
    end
endmodule
