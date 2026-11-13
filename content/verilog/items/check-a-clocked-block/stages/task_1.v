`timescale 1ns / 1ps
module testbench;
    reg clk, reset;
    reg [7:0] data;
    wire [7:0] q;
    integer errors;
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
        errors = 0;
        @(posedge clk);
        #1;
        if (q !== 0) errors = errors + 1;
        reset = 0;
        data = 8'h12;
        @(posedge clk);
        #1;
        if (q !== 8'h12) errors = errors + 1;
        if (errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL");
        $finish;
    end
    initial begin
        #90;
        $display("CHECK_FAIL timeout");
        $finish;
    end
endmodule
