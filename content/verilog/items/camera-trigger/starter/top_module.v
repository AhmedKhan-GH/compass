module top_module (
    input wire request,
    input wire enabled,
    input wire inhibit,
    output wire capture
);
    // Replace this constant with the condition for an allowed capture.
    assign capture = 1'b0;
endmodule
