module top_module #(
    parameter WIDTH = 1,
    DEPTH = 3,
    ADDR_WIDTH = 2
) (
    input wire clk,
    input wire reset,
    input wire en,
    input wire [WIDTH-1:0] data_in,
    output reg [WIDTH-1:0] data_out
);
    reg [WIDTH-1:0] mem[0:DEPTH-1];
    reg [ADDR_WIDTH-1:0] addr;
    always @(posedge clk)
        if (reset) begin
            addr <= 0;
            data_out <= 0;
        end else if (en) begin
            mem[addr] <= data_in;
            data_out <= data_in;
            addr <= addr + 1'b1;
        end
endmodule
