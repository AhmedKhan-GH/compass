module testbench;
    reg left, right, enable;
    wire lamp_a, lamp_b;
    harness dut (
        .left  (left),
        .right (right),
        .enable(enable),
        .lamp_a(lamp_a),
        .lamp_b(lamp_b)
    );
    initial begin
        left = 0;
        right = 0;
        enable = 0;
        #1;
        $display("CHECK_FAIL unfinished checker");
        $finish;
    end
endmodule
