module top_module (
    input wire clk,
    input wire reset,
    input wire load,
    input wire [7:0] word,
    output reg bit_out,
    output reg busy
);
    reg [7:0] data;
    reg [3:0] left;
    always @(posedge clk) begin
        if (reset) begin
            data <= 0;
            left <= 0;
            bit_out <= 0;
            busy <= 0;
        end else if (load) begin
            data <= word;
            left <= 8;
            busy <= 1;
        end else if (busy) begin
            bit_out <= data[0];
            data <= data >> 1;
            left <= left - 1;
            if (left == 1) busy <= 0;
        end
    end
endmodule
