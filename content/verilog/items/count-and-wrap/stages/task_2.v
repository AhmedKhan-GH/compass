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
            natural_count <= natural_count + 3'd1;
            if (six_count == 3'd5) six_count <= 0;
            else six_count <= six_count + 3'd1;
        end
    end
endmodule
