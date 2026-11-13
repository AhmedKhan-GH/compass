module top_module (
    input wire clk,
    input wire reset,
    input wire request,
    input wire clear,
    output reg stop,
    output reg caution,
    output reg go
);
    localparam STOP = 2'd0, GO = 2'd1, CAUTION = 2'd2;
    reg [1:0] state, next;
    always @* begin
        next = state;
        case (state)
            STOP: if (request) next = GO;
            GO: if (clear) next = CAUTION;
            CAUTION: next = CAUTION;
            default: next = STOP;
        endcase
    end
    always @(posedge clk)
        if (reset) state <= STOP;
        else state <= next;
    always @* begin
        stop = 0;
        caution = 0;
        go = 0;
        case (state)
            STOP: stop = 1;
            GO: go = 1;
            CAUTION: caution = 1;
            default: stop = 1;
        endcase
    end
endmodule
