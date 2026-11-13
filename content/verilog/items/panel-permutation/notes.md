# Panel permutation

Original Nebula practice exercise, IV-006. Practices `words` after Status word. Combines slices, individual indices, fixed widths and concatenation in one exact routing contract. The panel is eight independent binary lamps with a complete mapping table; no display encoding or board knowledge is assumed.

The mapping deliberately preserves two fields while reversing just the two flag bits. Thus copying the original word, reversing the entire word, and failing to reverse the flags represent three distinct compiling mistakes. Test the zero input and all eight one-bit inputs for diagnostic clarity, then all 256 input words and selected repeated transitions. The Python oracle uses the explicit output-to-input mapping rather than copying the reference concatenation.

The all-zero starter compiles and fails. An optimized diagram should show rewired buses, which is the educational result; do not manufacture gates to make the image busier. No loops, variable indices, arithmetic, reductions, conditionals or state are required in learner Verilog.
