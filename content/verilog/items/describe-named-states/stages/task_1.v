module top_module (
    input wire clk,
    input wire reset,
    input wire request,
    input wire clear,
    output reg stop,
    output reg caution,
    output reg go
);
    localparam STOP = 0, GO = 1, CAUTION = 2;
    reg [1:0] state, next;
    reg reset_seen = 0;
    always @* begin
        next = state;
        case (state)
            STOP: if (request) next = GO;
            GO: if (clear) next = CAUTION;
            CAUTION: next = STOP;
            default: next = STOP;
        endcase
    end
    always @(posedge clk)
        if (reset && !reset_seen) begin
            state <= STOP;
            reset_seen <= 1;
        end else state <= next;
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
