module top_module (
    input wire clk,
    input wire reset,
    input wire request_a,
    input wire request_b,
    output reg permit_a,
    output reg permit_b
);
    reg [1:0] state;
    always @(posedge clk) begin
        if (reset) state <= 0;
        else state <= state;  // TODO: implement interlocked transitions.
    end
    always @* begin
        permit_a = 0;
        permit_b = 0;
        if (request_a || request_b) begin
            permit_a = 0;
            permit_b = 0;  // TODO: decode the active state.
        end
    end
endmodule
