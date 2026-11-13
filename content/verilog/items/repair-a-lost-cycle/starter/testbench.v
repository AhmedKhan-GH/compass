`timescale 1ns / 1ps
module testbench;
    reg clk, reset;
    reg [7:0] sample;
    wire [7:0] recorded;
    recorder dut (
        .clk(clk),
        .reset(reset),
        .sample(sample),
        .recorded(recorded)
    );
    always #5 clk = ~clk;
    initial begin
        clk = 0;
        reset = 1;
        sample = 0;
        #100;
        $display("CHECK_FAIL unfinished checker");
        $finish;
    end
endmodule
