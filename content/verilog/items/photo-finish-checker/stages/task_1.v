`timescale 1ns / 1ps
module testbench;
    reg clk = 0;
    reg reset = 1;
    reg [7:0] bib = 0;
    reg [7:0] captured_bib;

    always #5 clk = ~clk;
    always @(posedge clk) begin
        if (reset) captured_bib <= 0;
        else captured_bib <= bib;
    end

    task inspect_frame;
        input [7:0] expected_bib;
        output matched;
        begin
            @(posedge clk);
            #1;
            matched = ((^captured_bib !== 1'bx) && (captured_bib === expected_bib));
        end
    endtask

    task present_bib;
        input [7:0] next_bib;
        begin
            // Choose a drive time that cannot race with the camera.
            bib = next_bib;
        end
    endtask

    grading_fixture fixture ();
endmodule
