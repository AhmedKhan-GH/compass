module top_module (
    output wire [1:0] lights
);
    // WRONG-ONLY-MARKER
    lamp first (.on(lights[0]));
    assign lights[1] = 1'b0;
endmodule
