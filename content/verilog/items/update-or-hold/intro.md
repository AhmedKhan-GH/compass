The market scale must sometimes keep a weight while its input changes. An **enabled register** updates on selected clock edges and keeps its old value on the others. If a clocked procedure does not assign a new value on an edge, that register holds.

This differs from an incomplete combinational procedure: leaving out an assignment there can accidentally create a latch.

The scale also has controls that can be high together. Decide which control wins before writing the conditions. For example, a clear operation may need to work even while the display is frozen. Order the decisions so the first matching rule gives the intended result.
