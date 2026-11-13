module recorder (
    input wire clk,
    input wire reset,
    input wire [7:0] sample,
    output reg [7:0] recorded
);
    always @(posedge clk)
        if (reset) recorded <= 0;
        else recorded <= sample;
endmodule
