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
    always @(posedge clk)
        if (reset) begin
            busy <= 0;
            done <= 0;
            dispensed <= 0;
            remaining <= 0;
        end else begin
            done <= 0;
            if (!busy && start) begin
                dispensed <= 0;
                remaining <= amount;
                if (amount == 0) done <= 1;
                else busy <= 1;
            end else if (busy) begin
                dispensed <= dispensed + 1'b1;
                if (remaining == 0) begin
                    remaining <= 0;
                    busy <= 0;
                    done <= 1;
                end else remaining <= remaining - 1'b1;
            end
        end
endmodule
