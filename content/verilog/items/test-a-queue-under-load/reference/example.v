module testbench;
    reg clk = 0, reset = 1, push = 0, pop = 0;
    reg [7:0] din = 0;
    wire [7:0] dout;
    wire empty;
    integer errors = 0;
    dut u (
        clk,
        reset,
        push,
        pop,
        din,
        dout,
        empty
    );
    always #5 clk = ~clk;
    task send;
        input [7:0] v;
        begin
            @(negedge clk);
            din = v;
            push = 1;
            @(negedge clk);
            push = 0;
        end
    endtask
    task receive;
        input [7:0] v;
        begin
            @(negedge clk);
            pop = 1;
            @(negedge clk);
            pop = 0;
            #1;
            if (dout !== v) begin
                errors = errors + 1;
                $display("mismatch expected=%h actual=%h", v, dout);
            end
        end
    endtask
    initial begin
        repeat (2) @(negedge clk);
        reset = 0;
        fork : worker_group
            begin
                send(8'h21);
                send(8'h32);
                send(8'h43);
                send(8'h54);
                send(8'h65);
                send(8'h76);
            end
            begin
                repeat (4) @(negedge clk);
                receive(8'h21);
                receive(8'h32);
                receive(8'h43);
                receive(8'h54);
                receive(8'h65);
                receive(8'h76);
                send(8'hA5);
                @(negedge clk);
                reset = 1;
                @(negedge clk);
                reset = 0;
                #1;
                if (empty !== 1'b1) begin
                    errors = errors + 1;
                    $display("reset mismatch expected empty=1 actual=%b", empty);
                end
                if (errors == 0) $display("CHECK_PASS");
                else $display("CHECK_FAIL errors=%0d", errors);
                disable worker_group;
            end
            begin
                repeat (30) @(negedge clk);
                $display("CHECK_FAIL watchdog");
                disable worker_group;
            end
        join
        $finish;
    end
endmodule
