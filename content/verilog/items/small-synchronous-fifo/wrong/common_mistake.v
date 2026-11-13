module top_module #(
    parameter WIDTH = 8,
    DEPTH = 5,
    ADDR_WIDTH = 3
) (
    input wire clk,
    input wire reset,
    input wire in_valid,
    output wire in_ready,
    input wire [WIDTH-1:0] in_data,
    output wire out_valid,
    input wire out_ready,
    output wire [WIDTH-1:0] out_data
);
    reg [WIDTH-1:0] mem[0:DEPTH-1];
    reg [ADDR_WIDTH-1:0] wp, rp;
    reg [ADDR_WIDTH:0] count;
    wire push = in_valid && in_ready, pop = out_valid && out_ready;
    assign in_ready = count < DEPTH;
    assign out_valid = count != 0;
    assign out_data = mem[rp];
    always @(posedge clk)
        if (reset) begin
            wp <= 0;
            rp <= 0;
            count <= 0;
        end else begin
            if (push) begin
                mem[wp] <= in_data;
                wp <= wp + 1'b1;
            end
            if (pop) rp <= (rp == DEPTH - 1) ? 0 : rp + 1'b1;
            case ({
                push, pop
            })
                2'b10:   count <= count + 1'b1;
                2'b01:   count <= count - 1'b1;
                default: count <= count;
            endcase
        end
endmodule
