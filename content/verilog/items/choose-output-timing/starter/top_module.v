module top_module (
    input wire clk,
    input wire reset,
    input wire alarm,
    input wire acknowledge,
    output wire immediate_warning,
    output wire stored_warning
);
    reg active;
    assign immediate_warning = 1'b0;  // TODO task 1: immediate timing.
    assign stored_warning = active;
    always @(posedge clk) begin
        if (reset) active <= 0;
        else active <= 0;  // TODO task 2: set, clear, and hold.
    end
endmodule
