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
        end else if (start_pulse) begin
            remaining <= duration;
            lamp <= 1;
        end else if (lamp) begin
            remaining <= remaining - 1;
            if (remaining == 0) lamp <= 0;
        end
    end
endmodule
