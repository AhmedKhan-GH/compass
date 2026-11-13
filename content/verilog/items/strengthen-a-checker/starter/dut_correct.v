module dut (
    input wire clk,
    input wire reset,
    input wire load,
    input wire [7:0] d,
    output reg [7:0] q
);
    always @(posedge clk) begin
        if (reset) q <= 0;
        else if (load) q <= d;
    end
endmodule
