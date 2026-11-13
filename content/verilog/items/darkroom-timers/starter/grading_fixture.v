`timescale 1ns / 1ps
module grading_fixture;
    integer failures = 0;

    task expect_lamps;
        input [2:0] expected;
        begin
            if (testbench.lamps !== expected) begin
                failures = failures + 1;
                $display("time=%0t expected lamps=%b actual=%b", $time, expected,
                         testbench.lamps);
            end
        end
    endtask

    task automatic run_exposure;
        input integer lamp_number;
        input integer duration_ns;
        realtime started;
        begin
            started = $realtime;
            testbench.expose(lamp_number, duration_ns);
            if (($realtime - started) != duration_ns) begin
                failures = failures + 1;
                $display("Lamp %0d task should return after %0d ns, got %0.3f ns",
                         lamp_number, duration_ns, $realtime - started);
            end
            if (testbench.lamps[lamp_number] !== 0) begin
                failures = failures + 1;
                $display("Lamp %0d must be off when its exposure task returns",
                         lamp_number);
            end
        end
    endtask

    initial begin
        $timeformat(-9, 1, " ns", 0);
        #2;
`ifdef SINGLE
        fork
            run_exposure(0, 7);
            begin
                #1;
                expect_lamps(3'b001);
                #5;
                expect_lamps(3'b001);
                #2;
                expect_lamps(3'b000);
            end
        join
        fork
            run_exposure(2, 3);
            begin
                #1;
                expect_lamps(3'b100);
                #3;
                expect_lamps(3'b000);
            end
        join
        fork
            run_exposure(1, 5);
            begin
                #1;
                expect_lamps(3'b010);
                #5;
                expect_lamps(3'b000);
            end
        join
`else
        fork
            run_exposure(0, 12);
            begin
                #3;
                run_exposure(1, 4);
            end
            begin
                #1;
                expect_lamps(3'b001);
                #3;
                expect_lamps(3'b011);
                #4;
                expect_lamps(3'b001);
                #5;
                expect_lamps(3'b000);
            end
        join
        fork
            run_exposure(0, 3);
            run_exposure(1, 9);
            run_exposure(2, 6);
            begin
                #1;
                expect_lamps(3'b111);
                #3;
                expect_lamps(3'b110);
                #3;
                expect_lamps(3'b010);
                #3;
                expect_lamps(3'b000);
            end
        join
        fork
            run_exposure(2, 12);
            begin
                #3;
                run_exposure(0, 4);
            end
            begin
                #1;
                expect_lamps(3'b100);
                #3;
                expect_lamps(3'b101);
                #4;
                expect_lamps(3'b100);
                #5;
                expect_lamps(3'b000);
            end
        join
`endif
        if (failures == 0) $display("CHECK_PASS fixture");
        else $display("CHECK_FAIL fixture errors=%0d", failures);
        $finish;
    end

    initial begin
        #100;
        $display("CHECK_FAIL fixture watchdog");
        $finish;
    end
endmodule
