module top_module (
    input wire [15:0] packet,
    input wire [7:0] calibration,
    output wire signed [9:0] temperature,
    output wire signed [9:0] calibrated_temperature,
    output wire signed [19:0] display_millidegrees
);
    assign temperature = packet[7:0];

    wire signed [9:0] correction;
    assign correction = $signed({2'b00, calibration});
    assign calibrated_temperature = temperature + correction;

    wire signed [19:0] wide_temperature;
    assign wide_temperature = calibrated_temperature;
    assign display_millidegrees = wide_temperature * 20'sd1000;
endmodule
