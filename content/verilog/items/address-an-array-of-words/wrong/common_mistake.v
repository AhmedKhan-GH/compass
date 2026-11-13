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
        for (i = 0; i < 8; i = i + 1) words[i] = 8'h10 + i;
    end
    always @* data = words[address];
    assign packed_byte = flat_word[address+:8];
endmodule
