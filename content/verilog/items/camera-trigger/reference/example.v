module top_module (
    input wire request,
    input wire enabled,
    input wire inhibit,
    output wire capture
);
    assign capture = request & enabled & ~inhibit;
endmodule
