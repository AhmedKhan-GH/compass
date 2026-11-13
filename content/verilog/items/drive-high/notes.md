# First Light: build a model before using logic

Assume no programming or circuit-design knowledge. Explain the source file, model boundary, port direction, and testbench before introducing a constant driver. Explain module, name, parentheses, port declaration, endmodule, wire and the continuous assignment. Use a complete, differently named off-indicator example; the learner decides what value their museum indicator needs.

The starter is an empty but compilable model. Task 1 adds its named one-bit output; task 2 drives the required value. The first stage passes only the interface task; the second passes both. Missing signals and incorrect widths give assertion failures with interface guidance, not grader exceptions. The interface check observes the named signal and width through the simulator; it is not a general HDL syntax or port-direction validator.

The reference retains the original solution and exercise identity. The low-output mutant proves that declaring a connection alone does not satisfy its behavior. Source changes receive normal content revisions; existing learner history is retained. Gates, inputs, clocks, board pins and physical implementation are not prerequisites.
