`timescale 1ns / 1ps
module testbench;
    reg [2:0] lamps = 0;

    task expose;
        input integer lamp_number;
        input integer duration_ns;
        begin
            // Start this lamp's exposure, wait for its duration, then finish it.
            #(duration_ns);
        end
    endtask

    grading_fixture fixture ();
endmodule
