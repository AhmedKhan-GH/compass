An enabled register updates on some clock edges and holds on others. If a clocked block does not assign a new value, the register keeps its old value. In a combinational block, leaving out an assignment can instead create an unwanted latch.

Several controls may be true on the same edge. Decide which control wins before writing the conditions. The first matching branch should choose the next stored value.
