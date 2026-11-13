module top_module (
    input wire button_a,
    input wire button_b,
    input wire blocked,
    output wire available,
    output wire start
);
    assign available = blocked;
    assign start = (button_a | button_b) & blocked;
endmodule
