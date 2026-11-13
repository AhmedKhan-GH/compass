module top_module (
    input wire [2:0] mode,
    output reg [3:0] lamps,
    output reg enabled
);
    always @* begin
        lamps = 4'b0000;
        enabled = 1'b1;
        case (mode)
            3'd0: begin
                lamps = 4'b0001;
                enabled = 0;
            end
            3'd1: lamps = 4'b0010;
            3'd2: lamps = 4'b0100;
            3'd3: lamps = 4'b1000;
            default: begin
                lamps = 0;
                enabled = 0;
            end
        endcase
    end
endmodule
