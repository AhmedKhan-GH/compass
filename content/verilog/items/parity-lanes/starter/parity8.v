module parity8 (
    input wire [7:0] data,
    input wire parity,
    output wire error
);
    assign error = (^data) ^ parity;
endmodule
