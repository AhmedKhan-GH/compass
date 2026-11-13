module top_module (
    input wire clk,
    input wire reset,
    input wire bit_in,
    output reg match
);
    // Choose the internal state needed to meet the behavior in the instructions.
    always @(posedge clk) begin
        match <= 1'b0;
    end
endmodule
