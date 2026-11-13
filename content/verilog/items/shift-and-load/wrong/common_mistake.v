module top_module (
    input wire clk,
    input wire reset,
    input wire load,
    input wire shift,
    input wire serial_in,
    input wire [7:0] parallel_in,
    output reg [7:0] pattern
);
    always @(posedge clk) begin
        if (reset) pattern <= 0;
        else if (shift) pattern <= {serial_in, pattern[7:1]};
        else if (load) pattern <= parallel_in;
        else pattern <= 0;
    end
endmodule
