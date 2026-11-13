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
            if (dout !== v) errors = errors + 1;
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
            end
            begin
                repeat (4) @(negedge clk);
                receive(8'h21);
                receive(8'h32);
                receive(8'h43);
                $display("CHECK_FAIL unfinished checker");
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
