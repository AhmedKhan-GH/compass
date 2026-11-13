module top_module (
    input wire clk,
    input wire reset,
    input wire [7:0] sample,
    output reg [7:0] captured,
    output reg [7:0] previous
);
    always @(posedge clk) begin
        if (reset) begin
            captured <= 8'h00;
            previous <= 8'h00;
        end else begin
            captured <= sample;
            previous <= captured;
        end
    end
endmodule
