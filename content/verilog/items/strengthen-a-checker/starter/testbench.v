module testbench;
    reg clk = 0, reset = 1, load = 0;
    reg [7:0] d = 0;
    wire [7:0] q;
    integer errors = 0;
    dut u (
        clk,
        reset,
        load,
        d,
        q
    );
    always #5 clk = ~clk;
    task load_and_check;
        input [7:0] value;
        begin
            @(negedge clk);
            load = 1;
            d = value;
            @(negedge clk);
            load = 0;
            #1;
            if (q !== value) begin
                errors = errors + 1;
                $display("mismatch expected=%h actual=%h", value, q);
            end
        end
    endtask
    initial begin
        repeat (2) @(negedge clk);
        reset = 0;
        load_and_check(8'h00);
        load_and_check(8'hA5);
        load_and_check(8'hFF);
        // TODO: add checks for holding while load=0 and reset after nonzero data.
        if (errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL errors=%0d", errors);
        $finish;
    end
endmodule
