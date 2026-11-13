module top_module (
    input wire request,
    input wire manual_mode,
    input wire [3:0] manual_opening,
    input wire [3:0] scheduled_opening,
    output reg motor_request,
    output reg [3:0] chosen_opening,
    output wire readings_identical
);
    always @* begin
        motor_request = 1'b0;
        if (request) begin
            motor_request = 1'b1;
        end
    end

    always @* begin
        if (manual_mode) begin
            chosen_opening = manual_opening;
        end else begin
            chosen_opening = scheduled_opening;
        end
    end

    assign readings_identical = (manual_opening === scheduled_opening);
endmodule
