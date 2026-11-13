module top_module (
    input wire clk,
    input wire reset,
    input wire alarm,
    input wire acknowledge,
    output wire immediate_warning,
    output wire stored_warning
);
    reg active;
    assign immediate_warning = alarm;
    assign stored_warning = active;
    always @(posedge clk)
        if (reset) active <= 0;
        else if (alarm) active <= 1;
endmodule
