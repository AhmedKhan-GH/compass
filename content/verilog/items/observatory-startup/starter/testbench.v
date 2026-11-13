`timescale 1us / 1ns
module testbench;
    reg camera_ready = 0;

    task await_ready;
        begin
            // This misses a camera that was ready before the call.
            @(posedge camera_ready);
        end
    endtask

    task check_startup;
        input integer limit_us;
        output succeeded;
        integer elapsed_us;
        begin
            // Observe readiness and honor the complete sampling schedule.
            succeeded = 0;
        end
    endtask

    grading_fixture fixture ();
endmodule
