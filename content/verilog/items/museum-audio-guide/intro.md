A module connection needs the correct name, width, and driver. In older Verilog code, a previously undeclared name in a module connection can silently become an **implicit one-bit wire**. A typo may therefore compile while leaving the intended wire undriven.

For example, a three-bit garden zone must travel through a three-bit connection:

```verilog
wire [2:0] selected_zone;
zone_reader reader (.zone(selected_zone));
```

Writing `selected_zoen` in that connection creates a different net under the default rules. The declared `selected_zone` then has no driver. Writing the correct name without declaring its width can also leave you with a one-bit connection: only the low bit survives.

The compiler directive below rejects implicit nets. Place it before your module and restore the default after the module so it does not change how unrelated source files are checked.

```verilog
`default_nettype none
// Module and all its explicit declarations go here.
`default_nettype wire
```

A wire also resolves all of its drivers. Driving 0 and 1 onto the same wire produces `x`, rather than choosing the later assignment. Repair a connection or replace an incorrect driver; adding another assignment does not override the original.

Use compiler diagnostics to locate declaration mistakes, then use Waveforms to check widths, undriven `z`, and conflicting `x`.
