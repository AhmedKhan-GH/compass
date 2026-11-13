module guide_receiver (
    input wire [7:0] beacon,
    output wire [3:0] stop_id,
    output wire [3:0] volume
);
    assign stop_id = beacon[7:4];
    assign volume = beacon[3:0];
endmodule
