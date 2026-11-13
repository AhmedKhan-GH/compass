module top_module (
    input wire [7:0] status,
    input wire [7:0] mask,
    input wire critical,
    input wire warning,
    output reg [7:0] shown,
    output reg [1:0] alert_code
);
    always @* begin
        shown = 0;
        alert_code = 0;
    end
endmodule
