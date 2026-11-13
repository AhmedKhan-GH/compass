`timescale 1ns / 1ps
module testbench;
    reg clk, reset;
    reg [7:0] data;
    wire [7:0] q;
    sample_register dut (
        .clk(clk),
        .reset(reset),
        .data(data),
        .q(q)
    );
    always #5 clk = ~clk;
    initial begin
        clk = 0;
        reset = 1;
        data = 0;
        #100;
        $display("CHECK_FAIL unfinished checker");
        $finish;
    end
endmodule
