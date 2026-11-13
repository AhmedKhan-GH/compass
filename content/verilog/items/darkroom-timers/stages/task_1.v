`timescale 1ns / 1ps
module testbench;
    reg [2:0] lamps = 0;

    task expose;
        input integer lamp_number;
        input integer duration_ns;
        begin
            lamps[lamp_number] = 1;
            #(duration_ns);
            lamps[lamp_number] = 0;
        end
    endtask

    grading_fixture fixture ();
endmodule
