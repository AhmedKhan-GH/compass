module testbench;
    reg left, right, enable;
    wire lamp_a, lamp_b;
    integer errors;
    harness dut (
        .left  (left),
        .right (right),
        .enable(enable),
        .lamp_a(lamp_a),
        .lamp_b(lamp_b)
    );
    task check;
        input l, r, e, ea, eb;
        begin
            left = l;
            right = r;
            enable = e;
            #1;
            if (lamp_a !== ea || lamp_b !== eb) begin
                errors = errors + 1;
                $display("inputs=%b%b%b expected=%b%b actual=%b%b", l, r, e, ea, eb,
                         lamp_a, lamp_b);
            end
        end
    endtask
    initial begin
        errors = 0;
        check(0, 0, 0, 0, 0);
        check(1, 0, 1, 1, 0);
        check(0, 1, 1, 0, 1);
        check(1, 1, 1, 1, 1);
        check(1, 1, 0, 0, 0);
        if (errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL errors=%0d", errors);
        $finish;
    end
endmodule
