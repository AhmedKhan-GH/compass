A **module** names a hardware model and declares its input and output ports. The port list is the interface to other modules or a testbench. A one-bit output declaration such as `output wire lamp` provides a connection, but does not give it a value.

A continuous assignment such as `assign lamp = 1'b0;` keeps that wire driven. The destination is on the left; the value is on the right. `1'b0` means a one-bit binary zero. The assignment remains active throughout the model's lifetime.
