`timescale 1ns / 1ps
module testbench;
    reg [2:0] lamps = 0;

    task automatic expose;
        input integer lamp_number;
        input integer duration_ns;
        begin
            lamps = 1 << lamp_number;
            #(duration_ns);
            lamps = 0;
        end
    endtask

    grading_fixture fixture ();
endmodule
