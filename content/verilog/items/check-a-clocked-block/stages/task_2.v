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
    task edge_check;
        input [7:0] value;
        begin
            data = value;
            @(posedge clk);
            #1;
            if (q !== value) begin
                errors = errors + 1;
                $display("after rising edge expected=%h actual=%h", value, q);
            end
        end
    endtask
    initial begin
        clk = 0;
        reset = 1;
        data = 8'haa;
        errors = 0;
        @(posedge clk);
        #1;
        if (q !== 0) errors = errors + 1;
        reset = 0;
        data = 8'h12;
        #2;
        if (q !== 0) begin
            errors = errors + 1;
            $display("changed before edge actual=%h", q);
        end
        edge_check(8'h12);
        data = 8'h66;
        @(negedge clk);
        #1;
        if (q !== 8'h12) begin
            errors = errors + 1;
            $display("changed at falling edge expected=12 actual=%h", q);
        end
        edge_check(8'he7);
        if (errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL errors=%0d", errors);
        $finish;
    end
    initial begin
        #90;
        $display("CHECK_FAIL timeout");
        $finish;
    end
endmodule
