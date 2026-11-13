`timescale 1us / 1ns
module grading_fixture;
    integer failures = 0;
    reg result_flag;
    realtime entered;
    realtime elapsed;

    task check_elapsed;
        input realtime expected;
        begin
            elapsed = $realtime - entered;
            if (elapsed < expected - 0.001 || elapsed > expected + 0.001) begin
                failures = failures + 1;
                $display("elapsed should be %0.3f us, got %0.3f us", expected, elapsed);
            end
        end
    endtask

    task poll_case;
        input integer budget;
        input expected_flag;
        input realtime expected_elapsed;
        begin
            entered = $realtime;
            testbench.check_startup(budget, result_flag);
            check_elapsed(expected_elapsed);
            if (result_flag !== expected_flag) begin
                failures = failures + 1;
                $display("budget=%0d us: succeeded should be %b, got %b", budget,
                         expected_flag, result_flag);
            end
        end
    endtask

    initial begin
        #0.1;
`ifdef CONDITION_WAIT
        testbench.camera_ready = 1;
        entered = $realtime;
        testbench.await_ready;
        check_elapsed(0.0);
        testbench.camera_ready = 0;
        fork
            begin
                #2.4;
                testbench.camera_ready = 1;
            end
            begin
                entered = $realtime;
                testbench.await_ready;
                check_elapsed(2.4);
            end
        join
        testbench.camera_ready = 1'bx;
        fork
            begin
                #0.7;
                testbench.camera_ready = 1'bz;
                #0.6;
                testbench.camera_ready = 0;
                #0.8;
                testbench.camera_ready = 1;
            end
            begin
                entered = $realtime;
                testbench.await_ready;
                check_elapsed(2.1);
            end
        join
`else
        testbench.camera_ready = 1;
        poll_case(4, 1, 0.0);
        poll_case(0, 1, 0.0);
        testbench.camera_ready = 0;
        poll_case(0, 0, 0.0);
        poll_case(3, 0, 3.0);
        testbench.camera_ready = 1'bx;
        poll_case(2, 0, 2.0);
        testbench.camera_ready = 0;
        fork
            begin
                #1.4;
                testbench.camera_ready = 1;
            end
            poll_case(3, 1, 2.0);
        join
        testbench.camera_ready = 0;
        fork
            begin
                #2.4;
                testbench.camera_ready = 1;
            end
            poll_case(3, 1, 3.0);
        join
        testbench.camera_ready = 0;
        fork
            begin
                #3.4;
                testbench.camera_ready = 1;
            end
            poll_case(3, 0, 3.0);
        join
`endif
        if (failures == 0) $display("CHECK_PASS fixture");
        else $display("CHECK_FAIL fixture errors=%0d", failures);
        $finish;
    end

    initial begin
        #50;
        $display("CHECK_FAIL fixture watchdog");
        $finish;
    end
endmodule
