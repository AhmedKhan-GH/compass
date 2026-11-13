module dut (
    input wire clk,
    input wire reset,
    input wire push,
    input wire pop,
    input wire [7:0] din,
    output reg [7:0] dout,
    output wire empty
);
    reg [7:0] m[0:3];
    reg [2:0] n;
    reg [1:0] w, r;
    assign empty = n == 0;
    always @(posedge clk)
        if (reset) begin
            n <= 0;
            w <= 0;
            r <= 0;
        end else begin
            if (push && n < 4) begin
                m[w] <= din;
                w <= w + 1'b1;
            end
            if (pop && n > 0) begin
                dout <= m[w];
                r <= r + 1'b1;
            end
            case ({
                push && n < 4, pop && n > 0
            })
                2'b10: n <= n + 1'b1;
                2'b01: n <= n - 1'b1;
            endcase

        end

endmodule
