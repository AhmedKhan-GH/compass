A decoder often recognizes a family of words while ignoring a few fields. Verilog `casez` treats `?` and `z` bits as wildcards in **both** the case item and the expression being examined. It does not treat `x` as a wildcard by itself.

A toy mailing sorter might recognize `4'b10??`: the upper two bits identify a category, while the lower two bits can be anything. In that pattern, lower-bit `x` values also match because the corresponding pattern positions are explicitly ignored. An `x` in a required upper bit does not match.

```verilog
always @* begin
    casez (destination)
        4'b10??: shelf = 2'd1;
        4'b11??: shelf = 2'd2;
        default: shelf = 2'd0;
    endcase
end
```

An input `z` can also be ignored at a position the pattern needs to check: this is how `casez` matches bits, not proof that a real disconnected line carries a valid category. If several case items match, the first matching item wins.

`casex` goes further and treats `x` as a wildcard too. That can make a decoder appear to recognize a valid command even though a required input bit is unknown. Use wildcard cases only when their matching rule is the rule you intend.

For a simulation diagnostic, reduction XOR (`^word`) is 0 or 1 if every bit is known, and `x` if any bit is `x` or `z`. Comparing that result with case inequality (`!==`) can report a definite known/unknown answer. This check works in simulation. Real communication hardware cannot detect an `x` value; it needs its own rules and signals for reporting valid data or errors.

This exercise first exposes wildcard matching, then separately decides whether an entire simulated message is complete enough to accept.
