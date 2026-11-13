A module connection needs a name, a bit width, and a source for its value. That source is called a driver. In older Verilog code, a previously undeclared name in a module connection can silently become an **implicit one-bit wire**. A typo may therefore compile while leaving the intended wire undriven.

For example, a three-bit garden zone must travel through a three-bit connection:

```verilog
wire [2:0] selected_zone;
zone_reader reader (.zone(selected_zone));
```

Writing `selected_zoen` in that connection creates a different net under the default rules. The declared `selected_zone` then has no driver. Writing the correct name without declaring its width can also leave you with a one-bit connection: only the low bit survives.

The compiler directive below rejects implicit nets. Place it before your module and restore the default after the module so the setting does not accidentally affect other source files.

```verilog
`default_nettype none
// Module and all its explicit declarations go here.
`default_nettype wire
```

The simulator combines the values from all of a wire’s drivers. If equally strong drivers supply 0 and 1, the wire becomes `x`; the last assignment does not win. Repair a connection or replace an incorrect driver; adding another assignment does not override the original.

Use compiler messages to find declaration mistakes. Then open Waveforms to check signal widths and look for `z` from missing drivers or `x` from conflicting drivers.
