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
        if (y !== 4'h3) begin
            errors = errors + 1;
            $display("expected=3 actual=%h", y);
        end
        if (errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL");
        $finish;
    end
endmodule
