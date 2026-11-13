module top_module (
    input wire [3:0] message,
    output reg [1:0] candidate_family,
    output wire word_known,
    output wire [1:0] accepted_family
);
    always @* begin
        casex (message)
            4'b00??: candidate_family = 2'd1;
            4'b01??: candidate_family = 2'd2;
            4'b1???: candidate_family = 2'd3;
            default: candidate_family = 2'd0;
        endcase
    end

    assign word_known = (^message !== 1'bx);

    assign accepted_family = word_known ? candidate_family : 2'd0;
endmodule
