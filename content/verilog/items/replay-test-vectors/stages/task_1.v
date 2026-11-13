module testbench;
    reg clk = 0, reset = 1, load = 0;
    reg [7:0] d = 0;
    wire [7:0] q;
    reg [7:0] vectors[0:5];
    integer i, errors = 0, pairs = 0;
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
        for (i = 0; i < 6; i = i + 2) begin
            pairs = pairs + 1;
            $display("pair=%0d input=%h expected=%h", i / 2, vectors[i], vectors[i+1]);
            if (^vectors[i] === 1'bx || ^vectors[i+1] === 1'bx) errors = errors + 1;
        end
        if (pairs == 3 && errors == 0) $display("CHECK_PASS");
        else $display("CHECK_FAIL vector file was not loaded");
        $finish;
    end
endmodule
