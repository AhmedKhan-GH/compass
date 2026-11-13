module top_module (
    input wire clk,
    input wire reset,
    input wire enable,
    output reg [2:0] natural_count,
    output reg [2:0] six_count
);
    always @(posedge clk) begin
        if (reset) begin
            natural_count <= 0;
            six_count <= 0;
        end else if (enable) begin
            natural_count <= natural_count + 1;
            six_count <= six_count + 1;
        end
    end
endmodule
