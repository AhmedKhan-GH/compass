module top_module (
    input wire signed [7:0] temperature,
    input wire signed [7:0] minimum,
    input wire signed [7:0] maximum,
    output wire alarm,
    output wire acceptable
);
    assign acceptable = (temperature >= minimum) && (temperature <= maximum);
    assign alarm = !acceptable;
endmodule
