module top_module (
    input wire [3:0] channel_a,
    input wire [3:0] channel_b,
    input wire select_b,
    input wire [1:0] channel,
    input wire override_active,
    input wire [3:0] override_data,
    output wire [3:0] selected,
    output wire [3:0] decoded,
    output wire [3:0] priority_selected
);
    // Task 1: choose A when select_b is 0, or B when it is 1.
    assign selected = 4'b0000;

    // Task 2: channel 00 chooses A; 01 chooses B; 10 and 11 choose zero.
    assign decoded = 4'b0000;

    // Task 3: override_active chooses override_data, otherwise use decoded.
    assign priority_selected = 4'b0000;
endmodule
