module top_module (
    input wire [7:0] status,
    input wire [7:0] mask,
    input wire critical,
    input wire warning,
    output reg [7:0] shown,
    output reg [1:0] alert_code
);
    always @* begin
        shown = status & mask;
        if (warning) alert_code = 2'b01;
        else if (critical) alert_code = 2'b01;
        else alert_code = 0;
    end
endmodule
