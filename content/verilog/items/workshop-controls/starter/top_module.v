module top_module (
    input wire button_a,
    input wire button_b,
    input wire blocked,
    output wire available,
    output wire start
);
    // Task 1: available = 1 when blocked = 0, otherwise 0.
    assign available = 1'b0;

    // Task 2: start = 1 when button_a = 1 AND blocked = 0, otherwise 0.
    // Task 3: either button may set start = 1, but blocked must still be 0.
    assign start = 1'b0;
endmodule
