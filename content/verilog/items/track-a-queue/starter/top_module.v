module top_module #(
    parameter DEPTH = 5,
    ADDR_WIDTH = 3
) (
    input wire clk,
    input wire reset,
    input wire push,
    input wire pop,
    output wire empty,
    output wire full,
    output reg [ADDR_WIDTH:0] count,
    output reg [ADDR_WIDTH-1:0] write_ptr,
    output reg [ADDR_WIDTH-1:0] read_ptr
);
    assign empty = 1'b1;
    assign full = 1'b0;
    always @(posedge clk) begin
        if (reset) begin
            count <= 0;
            write_ptr <= 0;
            read_ptr <= 0;
        end else begin
            // TODO task 1: advance accepted-operation pointers.
            // TODO task 2: update occupancy for every operation pair.
            count <= 0;
            write_ptr <= 0;
            read_ptr <= 0;
        end
    end
endmodule
