module top_module (
    output wire [1:0] lights
);
    // REFERENCE-ONLY-MARKER
    lamp first (.on(lights[0]));
    lamp second (.on(lights[1]));
endmodule
