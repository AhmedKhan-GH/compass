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
            divider <= divider + 1;
            update = (divider == 2);
            if (update) updates <= updates + 1;
        end
    end
endmodule
