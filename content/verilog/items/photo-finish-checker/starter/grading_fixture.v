`timescale 1ns / 1ps
module grading_fixture;
    integer failures = 0;
    reg matched;
    time started;

    task inspect_case;
        input [7:0] presented;
        input [7:0] expected;
        input expected_match;
        begin
            @(negedge testbench.clk);
            testbench.reset = 0;
            testbench.bib = presented;
            started = $time;
            testbench.inspect_frame(expected, matched);
            if (($realtime <= started + 5) || ($realtime >= started + 10)) begin
                failures = failures + 1;
                $display(
                    "Inspection must return after the rising edge and before the falling edge.");
            end
            if (matched !== expected_match) begin
                failures = failures + 1;
                $display("bib=%h expected=%h: matched should be %b, got %b", presented,
                         expected, expected_match, matched);
            end
        end
    endtask

    task drive_case;
        input [7:0] next_bib;
        begin
            started = $time;
            testbench.present_bib(next_bib);
            if (testbench.clk !== 0 || $realtime != started + 10 - (started % 10)) begin
                failures = failures + 1;
                $display("Present bib %h at the next falling edge, not at time %0t.",
                         next_bib, $time);
            end
            if (testbench.bib !== next_bib) failures = failures + 1;
            @(posedge testbench.clk);
            #1;
            if (testbench.captured_bib !== next_bib) begin
                failures = failures + 1;
                $display("Camera should capture %h, got %h.", next_bib,
                         testbench.captured_bib);
            end
        end
    endtask

    initial begin
        $timeformat(-9, 1, " ns", 0);
`ifdef OBSERVATION
        inspect_case(8'h12, 8'h12, 1);
        inspect_case(8'h93, 8'h93, 1);
        inspect_case(8'h27, 8'h28, 0);
        inspect_case(8'hxx, 8'hxx, 0);
        inspect_case(8'h51, 8'h51, 1);
`else
        @(negedge testbench.clk);
        testbench.reset = 0;
        #1;
        drive_case(8'h12);
        #1;
        drive_case(8'h93);
        #2;
        drive_case(8'h27);
`endif
        if (failures == 0) $display("CHECK_PASS fixture");
        else $display("CHECK_FAIL fixture errors=%0d", failures);
        $finish;
    end

    initial begin
        #200;
        $display("CHECK_FAIL fixture watchdog");
        $finish;
    end
endmodule
