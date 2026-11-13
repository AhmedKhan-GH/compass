# Explicit nets and drivers

A net represents a connection. Its drivers supply its value, and the simulator combines those values if there is more than one driver. Under Verilog's default rules, some undeclared names become one-bit wires, including names used in module connections. A typo or missing declaration can therefore compile without doing what you meant.

Declare each connection's name and width. Connecting an undeclared wire to a wide port does not give that wire the port's width. If only the lowest bit gets through, check both the port and the wire connected to it.

The directive `` `default_nettype none `` makes the compiler reject implicit nets. Restore `` `default_nettype wire `` after your module so the setting does not affect other files. Tests check how the circuit behaves; this compiler setting also catches undeclared connections before simulation starts.

Adding an assignment does not replace an existing driver. A wire with no driver can show `z`. Equally strong drivers supplying opposite values produce `x`. When you see either in a waveform, trace the wire back to its sources.
