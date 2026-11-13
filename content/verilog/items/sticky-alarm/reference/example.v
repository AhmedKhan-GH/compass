module top_module (
    input wire clk,
    input wire reset,
    input wire fault,
    input wire acknowledge,
    output reg alarm
);
    always @(posedge clk) begin
        if (reset) alarm <= 0;
        else if (fault) alarm <= 1;
        else if (acknowledge) alarm <= 0;
    end
endmodule
