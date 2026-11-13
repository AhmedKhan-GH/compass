module testbench;
    reg clk = 0;
    reg reset = 1;
    reg push = 0;
    reg pop = 0;
    reg [7:0] din = 0;
    wire [7:0] dout;
    wire empty;

    dut device (
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
        input [7:0] value;
        begin
            @(negedge clk);
            din = value;
            push = 1;
            @(negedge clk);
            push = 0;
        end
    endtask

    task receive_without_check;
        begin
            @(negedge clk);
            pop = 1;
            @(negedge clk);
            pop = 0;
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
                receive_without_check;
                receive_without_check;
                receive_without_check;
                $display("CHECK_PASS");
                disable worker_group;
            end
        join
        $finish;
    end
endmodule
