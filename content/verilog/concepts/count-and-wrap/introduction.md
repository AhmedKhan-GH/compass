A counter combines a register with arithmetic that computes its next value. A three-bit unsigned counter can represent 0 through 7, so adding one to 7 naturally wraps to 0.

To count through fewer positions, choose the value where the counter returns to zero. The bit width tells you which values fit; it does not tell you how many positions the device uses. An enable signal decides whether the counter advances or stays where it is on each clock edge.
