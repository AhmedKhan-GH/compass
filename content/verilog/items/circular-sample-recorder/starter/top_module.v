module top_module #(
    parameter WIDTH = 8,
    DEPTH = 5,
    ADDR_WIDTH = 3
) (
    input wire clk,
    input wire reset,
    input wire sample_valid,
    input wire [WIDTH-1:0] sample_data,
    input wire [ADDR_WIDTH-1:0] age,
    output wire [WIDTH-1:0] sample_out,
    output reg [ADDR_WIDTH:0] count
);
    reg [WIDTH-1:0] mem[0:DEPTH-1];
    reg [ADDR_WIDTH-1:0] write_ptr;

    assign sample_out = {WIDTH{1'b0}};  // TODO: select a retained sample by age.

    always @(posedge clk) begin
        if (reset) begin
            write_ptr <= 0;
            count <= 0;
        end else begin
            // TODO: accept samples, wrap write_ptr, and saturate count.
            write_ptr <= write_ptr;
            count <= count;
        end
    end
endmodule
