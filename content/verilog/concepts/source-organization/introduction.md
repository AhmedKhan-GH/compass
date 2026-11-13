A source file holds Verilog code. A module describes a hardware building block. Compiling several `.v` files makes their module definitions available. Instantiating those modules is what connects them into hardware.

A Verilog header, usually ending in `.vh`, contains text shared by source files. `` `include "settings.vh" `` inserts that text before the compiler processes the module. Headers should not be compiled as separate modules.

A preprocessor macro is a text substitution. A parameter sets a value for one module instance as the design is prepared for simulation or synthesis. Use a macro for a project-wide default and parameters when two instances may need different configurations.

```verilog
// An unrelated display header permits a build to choose another default.
`ifndef DISPLAY_SETTINGS_VH
`define DISPLAY_SETTINGS_VH
`ifndef DEFAULT_DIGITS
`define DEFAULT_DIGITS 4
`endif
`endif
```

The directive `` `ifndef `` means “if this name has not been defined.” The outer check includes the header only once within a compilation unit: source files processed together with shared preprocessor definitions. The inner check keeps a value already supplied by the build command. A module can then declare ``parameter DIGITS = `DEFAULT_DIGITS``; one instance can override `DIGITS` without changing every other instance.

Keep module files in the build's source list. Including an entire module file from another file while also compiling it separately can define that module twice. For this exercise Nebula supplies the source list; you edit the modules and header.
