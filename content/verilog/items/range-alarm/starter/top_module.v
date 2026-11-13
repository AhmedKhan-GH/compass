module top_module (
    input wire [7:0] sample,
    input wire [7:0] lower,
    input wire [7:0] upper,
    output wire in_range,
    output wire alarm
);
    assign in_range = 0;
    assign alarm = 0;
endmodule
