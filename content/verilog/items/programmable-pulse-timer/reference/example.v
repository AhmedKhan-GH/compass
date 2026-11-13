module top_module (
    input wire clk,
    input wire reset,
    input wire start_pulse,
    input wire [3:0] duration,
    output reg lamp
);
    reg [3:0] remaining;
    always @(posedge clk) begin
        if (reset) begin
            remaining <= 0;
            lamp <= 0;
        end else if (start_pulse && !lamp) begin
            if (duration == 0) begin
                remaining <= 0;
                lamp <= 0;
            end else begin
                remaining <= duration;
                lamp <= 1;
            end
        end else if (lamp) begin
            if (remaining == 1) begin
                remaining <= 0;
                lamp <= 0;
            end else remaining <= remaining - 1'b1;
        end
    end
endmodule
