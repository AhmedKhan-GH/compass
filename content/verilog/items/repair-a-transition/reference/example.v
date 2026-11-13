module top_module (
    input wire clk,
    input wire reset,
    input wire advance,
    output reg [1:0] state
);
    always @(posedge clk)
        if (reset) state <= 0;
        else if (advance)
            case (state)
                0: state <= 1;
                1: state <= 2;
                2: state <= 0;
                default: state <= 0;
            endcase
endmodule
