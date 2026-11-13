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
        motor_request = request;
    end

    assign chosen_opening = manual_mode ? manual_opening : scheduled_opening;

    assign readings_identical = (manual_opening === scheduled_opening);
endmodule
