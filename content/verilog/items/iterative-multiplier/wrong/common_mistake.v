module top_module (
    input wire clk,
    input wire reset,
    input wire start,
    input wire [7:0] a,
    input wire [7:0] b,
    output reg busy,
    output reg done,
    output reg [15:0] product
);
    reg [15:0] mcand;
    reg [7:0] mplier;
    reg [3:0] count;
    always @(posedge clk)
        if (reset) begin
            busy <= 0;
            done <= 0;
            product <= 0;
            count <= 0;
        end else begin
            done <= 0;
            if (!busy && start) begin
                product <= 0;
                mcand <= {8'b0, a};
                mplier <= b;
                count <= 0;
                busy <= 1;
            end else if (busy) begin
                if (mplier[1]) product <= product + mcand;
                mcand <= mcand << 1;
                mplier <= mplier >> 1;
                if (count == 7) begin
                    busy <= 0;
                    done <= 1;
                end
                count <= count + 1'b1;
            end
        end
endmodule
