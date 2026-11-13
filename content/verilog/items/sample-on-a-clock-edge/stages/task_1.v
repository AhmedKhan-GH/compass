module top_module (
    input wire clk,
    input wire reset,
    input wire [7:0] sample,
    output reg [7:0] captured,
    output reg [7:0] previous
);
    always @(posedge clk) begin
        if (reset) begin
            captured <= 0;
            previous <= 0;
        end else begin
            captured <= sample;
            previous <= 0;
        end
    end
endmodule
