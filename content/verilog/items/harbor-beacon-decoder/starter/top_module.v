module top_module (
    input wire [3:0] message,
    output reg [1:0] candidate_family,
    output wire word_known,
    output wire [1:0] accepted_family
);
    always @* begin
        candidate_family = message[1:0] & 2'b00;
    end

    assign word_known = 1'b0;

    assign accepted_family = 2'd0;
endmodule
