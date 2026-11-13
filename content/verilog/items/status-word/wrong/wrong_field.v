module top_module (
    input wire ready,
    input wire fault,
    input wire [1:0] mode,
    output wire [3:0] status,
    output wire fault_seen,
    output wire [1:0] mode_seen,
    output wire service_mode
);
    wire [3:0] packed_status;

    assign packed_status = {ready, fault, mode};
    assign status = packed_status;
    assign fault_seen = packed_status[2];
    assign mode_seen = packed_status[2:1];
    assign service_mode = (mode_seen == 2'b10);
endmodule
