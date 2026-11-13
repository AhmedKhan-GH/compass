module top_module #(
    parameter WIDTH = 8,
    DEPTH = 5,
    ADDR_WIDTH = 3
) (
    input wire clk,
    input wire reset,
    input wire write_en,
    input wire [ADDR_WIDTH-1:0] write_addr,
    input wire [WIDTH-1:0] write_data,
    input wire [ADDR_WIDTH-1:0] read_addr,
    output reg [WIDTH-1:0] read_data
);
    reg [WIDTH-1:0] mem[0:DEPTH-1];
    integer i;
    always @(posedge clk) begin
        if (reset) begin
            read_data <= 0;
            for (i = 0; i < DEPTH; i = i + 1) mem[i] <= 0;
        end
        // TODO task 1: implement legal writes and the registered read.
        // TODO task 2: add bounds and write-first collision behavior.
    end
endmodule
