module top_module (
    input wire ready,
    input wire fault,
    input wire [1:0] mode,
    output wire [3:0] status,
    output wire fault_seen,
    output wire [1:0] mode_seen,
    output wire service_mode
);
    // Task 1: widen this connection to four bits and assign the pattern 1010.
    wire packed_status;
    // Task 2: join ready, fault, and mode in that order, from left to right.
    assign packed_status = 1'b0;
    assign status = packed_status;

    // Task 3: read the fault bit from packed_status.
    assign fault_seen = 1'b0;

    // Task 4: read the two mode bits from packed_status.
    assign mode_seen = 2'b00;

    // Task 5: service_mode = 1 only when mode_seen is 2'b10, otherwise 0.
    assign service_mode = 1'b0;
endmodule
