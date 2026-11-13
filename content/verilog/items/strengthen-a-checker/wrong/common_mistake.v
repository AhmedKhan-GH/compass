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
        input [7:0] v;
        begin
            @(negedge clk);
            load = 1;
            d = v;
            @(negedge clk);
            load = 0;
            #1;
            if (q !== v) begin
                errors = errors + 1;
                $display("mismatch expected=%h actual=%h", v, q);
            end
        end
    endtask
    initial begin
        repeat (2) @(negedge clk);
        reset = 0;
        load_and_check(8'h00);
        load_and_check(8'hA5);
        load_and_check(8'hFF);
        reset = 1;
        @(negedge clk);
        #1;
        if (q !== 0) errors = errors + 1;
        $display("CHECK_PASS");
        $finish;
    end
endmodule
