module top_module (
    input wire clk,
    input wire reset,
    input wire request_a,
    input wire request_b,
    output reg permit_a,
    output reg permit_b
);
    localparam IDLE = 0, A = 1, B = 2;
    reg [1:0] state;
    always @(posedge clk)
        if (reset) state <= IDLE;
        else
            case (state)
                IDLE:
                if (request_a) state <= A;
                else if (request_b) state <= B;
                A: if (!request_a) state <= IDLE;
                B: if (!request_b) state <= IDLE;
                default: state <= IDLE;
            endcase
    always @* begin
        permit_a = (state == A);
        permit_b = (state == B);
    end
endmodule
