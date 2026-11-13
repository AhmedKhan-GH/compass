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
    wire do_push = push && !full;
    wire do_pop = pop && !empty;
    assign empty = count == 0;
    assign full = count == DEPTH;
    always @(posedge clk)
        if (reset) begin
            count <= 0;
            write_ptr <= 0;
            read_ptr <= 0;
        end else begin
            if (do_push) write_ptr <= (write_ptr == DEPTH - 1) ? 0 : write_ptr + 1'b1;
            if (do_pop) read_ptr <= (read_ptr == DEPTH - 1) ? 0 : read_ptr + 1'b1;
            case ({
                do_push, do_pop
            })
                2'b10:   count <= count + 1'b1;
                2'b01:   count <= count - 1'b1;
                2'b11:   count <= count + 1'b1;
                default: count <= count;
            endcase
        end
endmodule
