# IV-053: Channel calculator

Introduces a reusable Verilog function and explicit argument/result widths. The three four-bit outputs are population counts, not parity bits; their names are count_a, count_b, and count_c.

Task 1 checks the count for channel A. Task 2 adds independent counts for channels B and C. Compiling stage solutions preserve that boundary. Behavioral tests check results; the source and inferred circuit are the evidence for the intended function reuse. The introduction also explains constant function calls for width calculations, without a separate graded width-helper task.
