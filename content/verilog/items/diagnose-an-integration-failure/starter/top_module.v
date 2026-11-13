module top_module (
    input wire clk,
    input wire reset,
    input wire valid,
    input wire [7:0] sample,
    output reg out_valid,
    output reg [7:0] scaled
);
    // TODO: locate and repair the documented boundary, transition, circuit, or integration defect.
    wire [8:0] wide = {1'b0, sample} << 1;
    always @(posedge clk)
        if (reset) begin
            out_valid <= 0;
            scaled <= 0;
        end else begin
            out_valid <= valid;
            if (valid) scaled <= wide[8] ? 8'hff : wide[7:0];
        end

endmodule
