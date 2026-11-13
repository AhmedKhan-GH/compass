module top_module (
    input wire clk,
    input wire reset,
    input wire in_valid,
    output wire in_ready,
    input wire [7:0] in_data,
    output wire out_valid,
    input wire out_ready,
    output wire [7:0] out_data
);
    reg full;
    reg [7:0] data;
    assign in_ready = 1'b0;
    assign out_valid = 1'b0;
    assign out_data = data;
    always @(posedge clk) begin
        if (reset) begin
            full <= 0;
            data <= 0;
        end
        // TODO task 1: accept and expose one transfer.
        // TODO task 2: hold stalls and allow replacement.
    end
endmodule
