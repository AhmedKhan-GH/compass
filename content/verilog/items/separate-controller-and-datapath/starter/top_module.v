module top_module (
    input wire clk,
    input wire reset,
    input wire start,
    input wire [7:0] amount,
    output reg busy,
    output reg done,
    output reg [7:0] dispensed
);
    reg [7:0] remaining;
    always @(posedge clk) begin
        if (reset) begin
            busy <= 0;
            done <= 0;
            dispensed <= 0;
            remaining <= 0;
        end else begin
            // TODO task 1: load and update the working registers.
            // TODO task 2: implement busy/done control and boundaries.
            busy <= 0;
            done <= 0;
            dispensed <= 0;
            remaining <= 0;
        end
    end
endmodule
