module top_module (
    input wire clk,
    input wire reset,
    input wire request,
    input wire clear,
    output reg stop,
    output reg caution,
    output reg go
);
    reg [1:0] state;
    always @(posedge clk) begin
        if (reset) state <= 0;
        // TODO task 1: add named states and transitions.
        stop <= 0;
        caution <= 0;
        go <= 0;  // TODO task 2: decode exactly one Moore output.
    end
endmodule
