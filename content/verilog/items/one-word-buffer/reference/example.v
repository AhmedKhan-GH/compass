module top_module (
    input wire clk,
    input wire reset,
    input wire flush,
    input wire in_valid,
    output wire in_ready,
    input wire [7:0] in_data,
    output wire out_valid,
    input wire out_ready,
    output wire [7:0] out_data
);
    reg full;
    reg [7:0] data;
    assign in_ready = !flush && (!full || out_ready);
    assign out_valid = !flush && full;
    assign out_data = data;
    always @(posedge clk)
        if (reset || flush) full <= 0;
        else if (in_ready) begin
            full <= in_valid;
            if (in_valid) data <= in_data;
        end
endmodule
