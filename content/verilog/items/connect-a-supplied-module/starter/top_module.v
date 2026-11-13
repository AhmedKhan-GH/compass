module top_module (
    input wire [7:0] level,
    input wire [7:0] limit,
    input wire enable,
    output wire raw_high,
    output wire alarm
);
    assign raw_high = 0;
    assign alarm = 0;
endmodule
