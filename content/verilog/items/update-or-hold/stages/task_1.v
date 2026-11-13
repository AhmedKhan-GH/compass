module top_module (
    input wire clk,
    input wire reset,
    input wire load,
    input wire freeze,
    input wire [7:0] data,
    output reg [7:0] value
);
    always @(posedge clk) begin
        if (reset) value <= 0;
        else if (load) value <= data;
    end
endmodule
