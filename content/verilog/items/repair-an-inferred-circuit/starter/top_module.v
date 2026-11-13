module top_module (
    input wire enable,
    input wire select,
    input wire [7:0] a,
    input wire [7:0] b,
    output reg [7:0] y
);
    // Run and inspect this selector before changing the path that retains data.
    always @* begin
        if (enable) begin
            if (select) y = b;
            else y = a;
        end

    end

endmodule
