module recorder (
    input wire clk,
    input wire reset,
    input wire [7:0] sample,
    output reg [7:0] recorded
);
    reg [7:0] a, b;
    always @(posedge clk)
        if (reset) begin
            a <= 0;
            b <= 0;
            recorded <= 0;
        end else begin
            a <= sample;
            b <= a;
            recorded <= b;
        end
endmodule
