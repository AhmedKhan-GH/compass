module dut (
    input wire clk,
    input wire reset,
    input wire load,
    input wire [7:0] d,
    output reg [7:0] q
);
    initial q = 0;
    always @(posedge clk) begin
        if (load) q <= d;
    end
endmodule
