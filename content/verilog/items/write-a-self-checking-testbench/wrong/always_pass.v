`timescale 1ns / 1ps
module testbench;
    reg [3:0] a, b;
    reg select_b;
    wire [3:0] y;
    integer errors;
    selector dut (
        .a(a),
        .b(b),
        .select_b(select_b),
        .y(y)
    );
    task check;
        input [3:0] av, bv;
        input sv;
        input [3:0] expected;
        begin
            a = av;
            b = bv;
            select_b = sv;
            #1;
            if (y !== expected) begin
                errors = errors + 1;
                $display("mismatch a=%h b=%h select_b=%b expected=%h actual=%h", a, b,
                         select_b, expected, y);
            end
        end
    endtask
    initial begin
        errors = 0;
        check(4'h3, 4'hc, 0, 4'h3);
        check(4'h3, 4'hc, 1, 4'hc);
        check(4'ha, 4'h5, 0, 4'ha);
        check(4'ha, 4'h5, 1, 4'h5);
        $display("CHECK_PASS");
        $finish;
    end
endmodule
