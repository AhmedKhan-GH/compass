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
    reg [ADDR_WIDTH-1:0] wr;
    integer idx;
    assign sample_out = (age < count) ? mem[(wr+DEPTH-1-age)%DEPTH] : 0;
    always @(posedge clk)
        if (reset) begin
            wr <= 0;
            count <= 0;
        end else if (sample_valid) begin
            mem[wr] <= sample_data;
            wr <= (wr == DEPTH - 1) ? 0 : wr + 1'b1;
            if (count < DEPTH) count <= count + 1'b1;
        end
endmodule
