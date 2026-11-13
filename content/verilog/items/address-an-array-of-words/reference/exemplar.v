module top_module (
    input wire [2:0] address,
    output reg [7:0] data,
    output wire [7:0] packed_byte
);
    reg [7:0] words[0:7];
    reg [63:0] flat_word;
    integer i;
    initial begin
        flat_word = 64'h0123456789abcdef;
        words[0] = 8'h10;
        words[1] = 8'h21;
        words[2] = 8'h32;
        words[3] = 8'h43;
        words[4] = 8'h54;
        words[5] = 8'h65;
        words[6] = 8'h76;
        words[7] = 8'h87;
    end
    always @* data = words[address];
    assign packed_byte = flat_word[address*8+:8];
endmodule
