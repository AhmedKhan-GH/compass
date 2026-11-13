# Ghost frame: author intent

The learner must diagnose an accidental latch in a combinational display selector. The starter deliberately omits the disabled path, so enabling a nonzero word and then disabling the selector retains that old word. The reference supplies every path and infers a combinational selector.

The grader starts from a selected, definite word, then disables the output. This produces the promised retained-value trace rather than an exception while converting an uninitialized X. Later cases change the selected data without changing the control, switch inputs, and remain disabled across input changes. Binary-string assertions retain useful diagnostics for X/Z-valued outputs.

The designated additional misconception sets the disabled output to all ones, demonstrating that merely removing a latch does not establish the required blanking behavior. Circuit review and the behavioral transition test provide complementary evidence.
