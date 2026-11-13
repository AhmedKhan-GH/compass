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
        end else if (load && !busy) begin
            data <= word;
            left <= 8;
            bit_out <= word[7];
            busy <= 1;
        end else if (busy) begin
            if (left == 1) begin
                left <= 0;
                bit_out <= 0;
                busy <= 0;
            end else begin
                data <= {data[6:0], 1'b0};
                bit_out <= data[6];
                left <= left - 1'b1;
            end
        end
    end
endmodule
