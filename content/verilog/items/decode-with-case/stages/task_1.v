module top_module (
    input wire [2:0] mode,
    output reg [3:0] lamps,
    output reg enabled
);
    always @* begin
        lamps = 0;
        enabled = 1;
        case (mode)
            3'd0: begin
                lamps = 1;
                enabled = 0;
            end
            3'd1: lamps = 2;
            3'd2: lamps = 4;
            3'd3: lamps = 8;
            default: lamps = 0;
        endcase
    end
endmodule
