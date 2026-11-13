`timescale 1ns / 1ps
module testbench;
    reg [3:0] a, b;
    reg select_b;
    wire [3:0] y;
    integer errors;
    selector dut (
        .a(a),
        .b(b),
        .select_b(select_b),
        .y(y)
    );
    initial begin
        errors = 0;
        a = 4'h3;
        b = 4'hc;
        select_b = 0;
        #1;
        // Add expected/actual checks and finish with exactly one verdict marker.
        $display("CHECK_FAIL unfinished checker");
        $finish;
    end
endmodule
