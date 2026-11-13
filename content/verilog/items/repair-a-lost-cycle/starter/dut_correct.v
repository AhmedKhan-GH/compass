module recorder (
    input wire clk,
    input wire reset,
    input wire [7:0] sample,
    output reg [7:0] recorded
);
    reg [7:0] s1;
    always @(posedge clk)
        if (reset) begin
            s1 <= 0;
            recorded <= 0;
        end else begin
            s1 <= sample;
            recorded <= s1;
        end
endmodule
