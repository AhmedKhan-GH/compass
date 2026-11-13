module top_module (
    input wire clk,
    input wire reset,
    input wire [7:0] sample,
    output reg [7:0] delayed
);
    reg [7:0] stage_one;
    always @(posedge clk) begin
        if (reset) begin
            stage_one <= 0;
            delayed <= 0;
        end else begin
            stage_one <= sample;
            delayed <= stage_one;
        end
    end
endmodule
