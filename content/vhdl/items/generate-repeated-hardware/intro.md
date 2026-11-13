A `for ... generate` elaborates one lane expression per vector position. VHDL-2008 reduction `or grant` summarizes any positive lane count. Elaboration creates the configured hardware before simulation begins. Named associations make each connection reviewable, while generic-controlled ranges ensure that every instance has ports of the width selected for that instance.

A generate statement creates repeated hardware during elaboration. Its index is locally available inside the generated region:

```vhdl
bit_cells: for index in requests'range generate
    grants(index) <= requests(index) and not blocked(index);
end generate;

any_grant <= or grants;
```

This is structural replication, not a loop that runs over time. Using the vector's `'range` attribute keeps the generated bounds consistent with the declared generic width.
