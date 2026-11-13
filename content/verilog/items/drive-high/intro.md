### Start with a model

Before choosing gates, give the exhibit's indicator a place in your design. A **hardware model** is a text description of a circuit's connections and behavior. A simulator runs that description so you can check it before using real hardware. Nothing in this exercise programs a board or assigns a physical pin.

In Verilog, a **module** names a block of hardware. Its **ports** are the signals that cross the block's boundary. An input brings a signal in; an output carries a signal out. This first block only needs an output, because nobody controls its indicator yet.

### Name the block and add a port

A new source file can begin with an empty module:

```verilog
module beacon ();
endmodule
```

`module` starts the description, `beacon` is a name we chose, and `endmodule` ends it. The parentheses hold the port list; here it is empty. The semicolon after `)` finishes the header. This is a valid shell, but it has no connections or behavior yet.

To give this example a one-bit output, put a declaration inside the parentheses:

```verilog
module beacon (
    output wire lamp
);
endmodule
```

Read `output wire lamp` as “an outgoing connection named lamp.” `wire` is a signal driven by a connection; with no width written, it carries one bit. Declaring that signal does not decide its value. Write behavior after `);` and before `endmodule`. Indentation makes the structure easier to read; it does not create the structure. A comment starts with `//` and lasts to the end of its line.

### Give the output a value

For a separate example, suppose the beacon must stay **off**:

```verilog
module beacon (
    output wire lamp
);
    assign lamp = 1'b0;
endmodule
```

`assign` describes a **continuous assignment**: the connection keeps driving its destination for as long as the model exists. The left side names the destination; the right side supplies the value. It is not an instruction that runs once and then returns a result. In `1'b0`, the first `1` means one bit, `b` means binary, and the last `0` is the value. The semicolon ends the assignment.

### Connect your model to the tests

Your starter uses the name `top_module`. That is the name Nebula's tests look for, not a special Verilog keyword. The editable file is `top_module.v`; `.v` identifies a Verilog source file. The module name inside the file identifies the block.

**Run tests** compiles your source, creates an instance of your module in a simulator, and runs a **testbench**: code that checks its signals. An instance is one copy of the described block. Here the testbench watches `out`; in the next lesson it will also supply an input. You can read the supplied test file, but you do not need to write testbench code yet.

Run tests after each task and inspect **Results**. Adding the output can pass the first task before its value passes the second. An undriven Verilog wire may show `z`, meaning no active driver, rather than `0` or `1`. Once the model works, **Circuit** shows its logical connection and **Waveform** shows the recorded signal over time. Use **Submit** after all tests pass to complete the exercise.
