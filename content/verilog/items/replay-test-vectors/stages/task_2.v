module testbench;
    reg clk = 0, reset = 1, load = 0;
    reg [7:0] d = 0;
    wire [7:0] q;
    reg [7:0] vectors[0:5];
    integer i, errors = 0;
    dut u (
        clk,
        reset,
        load,
        d,
        q
    );
    always #5 clk = ~clk;
    initial begin
        $readmemh("vectors.hex", vectors);
        repeat (2) @(negedge clk);
        reset = 0;
        for (i = 0; i < 6; i = i + 2) begin
            @(negedge clk);
            load = 1;
            d = vectors[i];
            @(negedge clk);
            load = 0;
            #1;
            if (q !== vectors[i+1]) begin
                errors = errors + 1;
                $display("mismatch expected=%h actual=%h", vectors[i+1], q);
            end
        end
        if (errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL errors=%0d", errors);
        $finish;
    end
endmodule
