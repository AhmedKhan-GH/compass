module top_module (
    input wire clk,
    input wire reset,
    input wire bit_in,
    output reg match
);
    reg [1:0] hist;
    always @(posedge clk)
        if (reset) begin
            hist <= 0;
            match <= 0;
        end else begin
            match <= {hist, bit_in} == 3'b101;
            hist <= match ? 2'b00 : {hist[0], bit_in};
        end
endmodule
