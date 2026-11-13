`timescale 1us / 1ns
module testbench;
    reg camera_ready = 0;

    task await_ready;
        begin
            @(posedge camera_ready);
        end
    endtask

    task check_startup;
        input integer limit_us;
        output succeeded;
        integer elapsed_us;
        begin
            elapsed_us = 0;
            succeeded = (camera_ready === 1'b1);
            while (!succeeded && elapsed_us < limit_us) begin
                #1;
                elapsed_us = elapsed_us + 1;
                succeeded = (camera_ready === 1'b1);
            end
        end
    endtask

    grading_fixture fixture ();
endmodule
