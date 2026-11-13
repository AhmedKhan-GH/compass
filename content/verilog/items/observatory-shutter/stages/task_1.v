module top_module (
    input wire request,
    input wire manual_mode,
    input wire [3:0] manual_opening,
    input wire [3:0] scheduled_opening,
    output reg motor_request,
    output wire [3:0] chosen_opening,
    output wire readings_identical
);
    always @* begin
        motor_request = 1'b0;
        if (request) begin
            motor_request = 1'b1;
        end
    end

    assign chosen_opening = 4'b0000;

    assign readings_identical = 1'b0;
endmodule
