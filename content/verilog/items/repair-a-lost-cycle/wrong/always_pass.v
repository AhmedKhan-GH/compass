`timescale 1ns / 1ps
module testbench;
    reg clk, reset;
    reg [7:0] sample;
    wire [7:0] recorded;
    integer errors;
    reg [7:0] expected_previous;
    recorder dut (
        .clk(clk),
        .reset(reset),
        .sample(sample),
        .recorded(recorded)
    );
    always #5 clk = ~clk;
    task step;
        input [7:0] next;
        begin
            sample = next;
            @(posedge clk);
            #1;
            if (recorded !== expected_previous) begin
                errors = errors + 1;
                $display("sample=%h expected prior=%h actual=%h", next,
                         expected_previous, recorded);
            end
            expected_previous = next;
        end
    endtask
    initial begin
        clk = 0;
        reset = 1;
        sample = 0;
        errors = 0;
        expected_previous = 0;
        @(posedge clk);
        #1;
        reset = 0;
        step(8'h11);
        step(8'ha2);
        step(8'h3c);
        step(8'hf0);
        $display("CHECK_PASS");
        $finish;
    end
    initial begin
        #100;
        $display("CHECK_FAIL timeout");
        $finish;
    end
endmodule
