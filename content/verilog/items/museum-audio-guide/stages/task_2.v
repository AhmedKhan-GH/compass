`default_nettype none
module top_module (
    input wire [7:0] beacon,
    input wire listen_button,
    input wire signal_present,
    output wire [3:0] recognized_stop,
    output wire [3:0] speaker_volume,
    output wire play_request
);
    wire [3:0] decoded_stop;
    wire [3:0] volume_setting;
    guide_receiver receiver (
        .beacon (beacon),
        .stop_id(decoded_stop),
        .volume (volume_setting)
    );

    assign recognized_stop = decoded_stop;
    assign speaker_volume = volume_setting;
    assign play_request = listen_button;
    assign play_request = 1'b0;
endmodule
`default_nettype wire
