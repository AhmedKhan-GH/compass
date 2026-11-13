module testbench;
    reg clk = 0, reset = 1, load = 0;
    reg [7:0] d = 0;
    wire [7:0] q;
    integer observations = 0, errors = 0;
    dut u (
        clk,
        reset,
        load,
        d,
        q
    );
    always #5 clk = ~clk;
    task load_and_observe;
        input [7:0] value;
        begin
            @(negedge clk);
            load = 1;
            d = value;
            @(negedge clk);
            load = 0;
            #1;
            observations = observations + 1;
            $display("loaded=%h observed=%h", value, q);
            if (^q === 1'bx) errors = errors + 1;
        end
    endtask
    initial begin
        repeat (2) @(negedge clk);
        reset = 0;
        load_and_observe(8'h3C);
        load_and_observe(8'hA5);
        if (observations == 2 && errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL stimulus did not complete");
        $finish;
    end
endmodule
