module top_module (
    input wire clk,
    input wire reset,
    input wire active,
    output reg [3:0] duration,
    output reg done
);
    reg [3:0] count;
    always @(posedge clk) begin
        if (reset) begin
            count <= 0;
            duration <= 0;
            done <= 0;
        end else begin
            done <= 0;
            if (active) begin
                if (count != 4'hf) count <= count + 1'b1;
            end else if (count != 0) begin
                duration <= count;
                count <= 0;
                done <= 1;
            end
        end
    end
endmodule
