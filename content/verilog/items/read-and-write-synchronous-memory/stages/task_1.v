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
        end else begin
            if (write_en && write_addr < DEPTH) mem[write_addr] <= write_data;
            if (read_addr < DEPTH) read_data <= mem[read_addr];
            else read_data <= 0;
        end
    end
endmodule
